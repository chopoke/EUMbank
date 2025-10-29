package com.boot.eumbank.product.service.product;

import com.boot.eumbank.product.dto.product.ProductDto;

import java.util.List;

public interface ProductService {

    public List<ProductDto> findAllProducts();

}
