package com.trendzy.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;

@Configuration
@EnableReactiveMongoRepositories(basePackages = {"com.trendzy.api.repository"})
@EnableMongoAuditing
public class MongoConfig {
}
