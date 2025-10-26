// src/pages/depositSaving/router/depositSavingRoutes.js
import React from "react";
import { Route } from "react-router-dom";

import ProtectedRoute from "../components/ProtectFunction";

// ⚠️ 폴더명 오타 주의
import DepositSavingProductList from "../commom/DepositSavingProductList";
import TermAgreements from "../commom/TermAgreements";
import DepositSubscription from "../page/DepositSubscription";
import SavingsSubscription from "../page/SavingsSubscription";
import ForeignSubscription from "../page/ForeignSubscription";

// ✅ JSX 없이 React.createElement로 만든 "리터럴 Fragment 엘리먼트"
export const depositSavingRouteElements = React.createElement(
  React.Fragment,
  null,
  // 목록/메인
  React.createElement(Route, {
    path: "/depositSavingProductList/open",
    element: React.createElement(DepositSavingProductList),
  }),

  // 예금
  React.createElement(Route, {
    path: "/deposit/open",
    element: React.createElement(
      ProtectedRoute, // 1. 보호막 컴포넌트로 감싼다
      null,
      // 2. 보호막을 통과했을 때 보여줄 실제 컴포넌트
      React.createElement(TermAgreements, { productType: "예금" })
    ),
  }),

  // 예금 최종 페이지
  React.createElement(Route, {
    path: "/deposit/form",
    element: React.createElement(DepositSubscription, { productType: "예금" }),
  }),

  // 적금
  React.createElement(Route, {
    path: "/savings/open",
    element: React.createElement(TermAgreements, { productType: "적금" }),
  }),

  // 적금 최종 페이지
  React.createElement(Route, {
    path: "/savings/form",
    element: React.createElement(SavingsSubscription, { productType: "적금" }),
  }),

  // 외환
  React.createElement(Route, {
    path: "/fx/open",
    element: React.createElement(TermAgreements, { productType: "외환" }),
  }),

  // 외화 최종 페이지
  React.createElement(Route, {
    path: "/fx/form",
    element: React.createElement(ForeignSubscription, { productType: "외환" }),
  }),

);
