// enums/FileType.java
package com.boot.eumbank.account.open.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FileType {
    주민등록증("신분증"),
    예금확인서("예금확인서"),
    적금확인서("적금확인서"),
    통장사본("통장사본"),
    거주지확인서("거주지 확인서"),
    사업자등록증("사업자등록증");

    private final String description;
}