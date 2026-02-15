
global.RESPONSE_FLAG_TYPE = {
    UNDEFINED_PARAM: -4,
    NOT_FOUND_ERROR: -3,
    ASYNC_JSON_DATA_ERROR: -1,

    PUG_RENDER: 0,
    ASYNC_JSON_DATA: 1,
    REDIRECT: 2,
    LOING_SUCCESS : 3,
}


global.RESPONSE_TYPE = {
    PARAM_ERROR: 97,       // 서버 요청 오류
    SYSTEM_ERROR : 98,     // 서버 내부 오류
    REQUEST_ERROR : 99,    // API 요청 오류
    SUCCESS: 0,
    SUCCESS_ROLLBACK: 1,
};