// src/pages/depositSaving/router/depositSavingRoutes.js
import React from "react";
import { Route } from "react-router-dom";

// ⚠️ 폴더명 오타 주의
import DepositSavingProductList from "../commom/DepositSavingProductList";
import TermAgreements from "../commom/TermAgreements";
import DepositSubscription from "../page/DepositSubscription";
import SavingsSubscription from "../page/SavingsSubscription";
import ForeignSubscription from "../page/ForeignSubscription";

// ✅ JSX 없이 React.createElement로 만든 "리터럴 Fragment 엘리먼트"
export const depositSavingRouteElements = (
  <>
    {/* 목록/메인 */}
    <Route
      path="/depositSavingProductList/open"
      element={<DepositSavingProductList />}
    />

    {/* 예금 */}
    <Route
      path="/deposit/open"
      element={<TermAgreements productType="예금" />}
    />
    <Route
      path="/deposit/form"
      element={<DepositSubscription productType="예금" />}
    />

    {/* 적금 */}
    <Route
      path="/savings/open"
      element={<TermAgreements productType="적금" />}
    />
    <Route
      path="/savings/form"
      element={<SavingsSubscription productType="적금" />}
    />

    {/* 외환 */}
    <Route
      path="/fx/open"
      element={<TermAgreements productType="외환" />}
    />
    <Route
      path="/fx/form"
      element={<ForeignSubscription productType="외환" />}
    />
  </>
);