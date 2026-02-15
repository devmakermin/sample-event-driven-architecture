function resEnd(pathname, flag, response, returns) {
    if (typeof response.send === "function") {
        response.send(returns);
    } else {
        response.write(JSON.stringify(returns));
        response.end();
    }

    logger.info("path called " + pathname + " end");
}
module.exports = {
    resEnd

}