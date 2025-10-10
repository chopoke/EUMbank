const apiConfig = {
    baseUrl: process.env.REACT_APP_API_BASE_URL || "http://localhost:1283",
    defaultHeaders: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
};

if (!apiConfig.baseUrl) {
    console.error("API Base URL is not defined. Please check your environment variables.");
}

export default apiConfig;