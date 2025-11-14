// dto/DocumentListResponse.java
package com.boot.eumbank.account.open.dto.mypage;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class DocumentListResponse {

    private List<DocumentResponse> documents;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int size;
}