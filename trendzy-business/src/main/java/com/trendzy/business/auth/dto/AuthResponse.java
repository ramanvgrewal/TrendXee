package com.trendzy.business.auth.dto;

import com.trendzy.business.user.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private User user;
}
