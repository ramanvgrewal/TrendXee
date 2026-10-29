
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

public class GenerateKeys {
    public static void main(String[] args) throws Exception {
        if (Files.exists(Path.of("private.pem")) || Files.exists(Path.of("public.pem"))) {
            throw new IllegalStateException("Key files already exist. Keep the current keys or choose a new working directory.");
        }
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        String privKey = "-----BEGIN PRIVATE KEY-----\n" +
                Base64.getMimeEncoder(64, new byte[]{10}).encodeToString(kp.getPrivate().getEncoded()) +
                "\n-----END PRIVATE KEY-----\n";
        String pubKey = "-----BEGIN PUBLIC KEY-----\n" +
                Base64.getMimeEncoder(64, new byte[]{10}).encodeToString(kp.getPublic().getEncoded()) +
                "\n-----END PUBLIC KEY-----\n";

        try (FileOutputStream out = new FileOutputStream("private.pem")) { out.write(privKey.getBytes()); }
        try (FileOutputStream out = new FileOutputStream("public.pem")) { out.write(pubKey.getBytes()); }
        System.out.println("Keys generated successfully.");
    }
}

