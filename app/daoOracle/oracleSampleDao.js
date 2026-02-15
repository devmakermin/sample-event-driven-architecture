let oracledb = require('oracledb');

let PKG_SAMPLE_INFO = {
	GET_SAMPLE_DATA: "PKG_SAMPLE_INFO.GET_SAMPLE_DATA",
}

async function getSampleData() {

	let params = {
		fetch_data: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
	}

	let mapping = "(:fetch_data)";

	return await oracleManager.executeQuery(PKG_SAMPLE_INFO.GET_SAMPLE_DATA, mapping, params, "fetch_data");
}
module.exports = {
    getSampleData
};
