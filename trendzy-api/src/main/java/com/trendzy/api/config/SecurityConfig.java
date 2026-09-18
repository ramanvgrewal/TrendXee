package com.trendzy.api.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${app.jwt.public-key-path}")
    private String publicKeyPath;
    
    @Value("${app.cookie.name:trendxee_token}")
    private String cookieName;

    private final ResourceLoader resourceLoader;

    public SecurityConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .cors(cors -> {})
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(org.springframework.http.HttpMethod.OPTIONS).permitAll()
                        .pathMatchers("/api/v2/archive/**").authenticated()
                        .anyExchange().permitAll()
                )
                .addFilterAt(jwtAuthenticationFilter(), SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }

    private WebFilter jwtAuthenticationFilter() {
        return (ServerWebExchange exchange, WebFilterChain chain) -> {
            String token = null;
            
            // 1. Try cookie
            HttpCookie cookie = exchange.getRequest().getCookies().getFirst(cookieName);
            if (cookie != null) {
                token = cookie.getValue();
            }
            
            // 2. Try header
            if (token == null) {
                String bearer = exchange.getRequest().getHeaders().getFirst("Authorization");
                if (bearer != null && bearer.startsWith("Bearer ")) {
                    token = bearer.substring(7);
                }
            }

            if (token != null) {
                try {
                    RSAPublicKey rsaPublicKey = loadPublicKey();
                    ConfigurableJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();
                    com.nimbusds.jose.jwk.RSAKey rsaJWK = new com.nimbusds.jose.jwk.RSAKey.Builder(rsaPublicKey).build();
                    JWKSource<SecurityContext> jwkSource = new com.nimbusds.jose.jwk.source.ImmutableJWKSet<>(new com.nimbusds.jose.jwk.JWKSet(rsaJWK));
                    JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(
                            JWSAlgorithm.RS256,
                            jwkSource
                    );
                    jwtProcessor.setJWSKeySelector(keySelector);
                    JWTClaimsSet claimsSet = jwtProcessor.process(token, null);
                    
                    String userId = claimsSet.getSubject();
                    String role = claimsSet.getStringClaim("role");
                    if (role == null) role = "USER";

                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

                    return chain.filter(exchange)
                            .contextWrite(org.springframework.security.core.context.ReactiveSecurityContextHolder.withAuthentication(auth));
                } catch (Exception e) {
                    // Invalid token, continue unauthenticated
                }
            }
            
            return chain.filter(exchange);
        };
    }

    private RSAPublicKey loadPublicKey() throws Exception {
        Resource resource = resourceLoader.getResource(publicKeyPath);
        try (InputStream is = resource.getInputStream()) {
            String key = new String(is.readAllBytes());
            String publicKeyPEM = key.replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] encoded = Base64.getDecoder().decode(publicKeyPEM);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(encoded);
            return (RSAPublicKey) keyFactory.generatePublic(keySpec);
        }
    }
}
