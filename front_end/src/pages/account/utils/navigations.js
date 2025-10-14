/**
 * 계좌 개설 페이지로 이동하는 함수
 * @param {Function} navigate - React Router의 navigate 함수
 */
export const goToAccountOpenPage = (navigate) => {
  // navigate 함수가 유효한지 확인하고 실행 (안전장치)
    navigate("/account/open");
  
};