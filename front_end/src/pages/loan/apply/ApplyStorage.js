export const keyFor = (code) => `apply:${code}`;

export function loadFlow(code){
  try{
    const raw = sessionStorage.getItem(keyFor(code));
    return raw ? JSON.parse(raw) : null;
  }catch{ return null; }
}

export function saveFlow(code, flow){
  sessionStorage.setItem(keyFor(code), JSON.stringify(flow));
}

export function ensureStep(flow, requiredStep){
  // flow.step === 사용자가 완료한 최종 단계
  return flow && Number(flow.step || 0) >= Number(requiredStep);
}
