package com.boot.eumbank.account.Open.util;

import java.security.SecureRandom;

public final class AccountIds {
        private static final SecureRandom RNG = new SecureRandom();
        private static final char[] ALPHABET =
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();

        private AccountIds() {}

        // 예: A0VQ2X9LkFa8B2cN1D (19자, VARCHAR(20) 안전)
        public static String newId() {
            String ts = Long.toString(System.currentTimeMillis(), 36).toUpperCase(); // ~8자
            if (ts.length() > 8) ts = ts.substring(ts.length() - 8);
            while (ts.length() < 8) ts = "0" + ts;

            StringBuilder sb = new StringBuilder(19);
            sb.append('A').append(ts);
            for (int i = 0; i < 10; i++) sb.append(ALPHABET[RNG.nextInt(ALPHABET.length)]);
            return sb.toString();
        }
    }