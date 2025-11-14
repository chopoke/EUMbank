package com.boot.eumbank.product.service.product.Impl;

import com.boot.eumbank.account.open.enums.DocumentStatus;
import com.boot.eumbank.account.open.enums.FileType;
import com.boot.eumbank.account.open.jpa.repository.mypage.DocumentRepository;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.product.entity.product.DocumentFile;
import com.boot.eumbank.product.service.product.LoanDocumentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;


/**
 * 대출용 서류 업로드 서비스(경로 분기를 위해 )
 */
@Service @RequiredArgsConstructor
public class LoanDocumentServiceImpl implements LoanDocumentService {

    private final DocumentRepository docuRepo;
    private final Logger logger = LoggerFactory.getLogger(LoanDocumentServiceImpl.class);

    @Value("${file.upload-loan:C:/uploads/loanPdfs}")
    private String uploadDir;

    @Override
    @Transactional
    public void saveLoanDocument(MultipartFile file, FileType fileType) { 

        if(file == null || file.isEmpty()){
            throw new IllegalArgumentException("업로드 된 파일이 없습니다.");
        }

        String originFileName = file.getOriginalFilename();     // 원본파일명

        String extension = "";
        if(originFileName != null && originFileName.contains(".")){     // 들어온 경로에 .이 있으면
            extension = originFileName.substring(originFileName.lastIndexOf("."));      // . 기준으로 뽑아내기
        }

        // 디렉토리 생성
        File dir = new File(uploadDir);
        if(!dir.exists()){          // 없다면
            boolean created = dir.mkdirs();     //생성
            if(!created){           // 생성 실패했다면 에러
                throw new RuntimeException(("디렉토리 생성에 실패했습니다."));
            }
        }

        String savedFilename = UUID.randomUUID().toString() + extension;    // 이름 섞어서
        Path filePath = Paths.get(uploadDir, savedFilename);        // 경로 설정

        try{
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);   // 파일 카피 생성
            logger.info("대출서류 디렉토리에 저장 완료");
        } catch(IOException e){
            logger.info("대출서류 디렉토리에 저장 중 오류 발생 {}", e.getMessage(),e);
            throw new RuntimeException("대출서류 저장 실패");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) auth.getPrincipal();

        DocumentFile document = DocumentFile.builder()
                .type(fileType)
                .pdfPath(filePath.toString())
                .pdfName(originFileName)
                .cNo(customer.getCustomerNo())
                .status(DocumentStatus.PENDING)
                .build();

        docuRepo.save(document);
        logger.info("대출서류 DB 저장 완료 - 고객번호 {}", customer.getCustomerNo());

    }
}
