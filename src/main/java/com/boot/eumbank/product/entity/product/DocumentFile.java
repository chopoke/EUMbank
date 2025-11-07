package com.boot.eumbank.product.entity.product;

import com.boot.eumbank.account.open.enums.FileType;
import com.boot.eumbank.account.open.enums.DocumentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "d_no")
    private Integer dNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 100)
    private FileType type;

    @Column(name = "pdf_path", nullable = false, length = 500)
    private String pdfPath;

    @Column(name = "pdf_name", nullable = false, length = 255)
    private String pdfName;

    @Column(name = "a_no")
    private Integer aNo;

    @Column(name = "c_no")
    private Integer cNo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;  // 기본값: 심사중
}