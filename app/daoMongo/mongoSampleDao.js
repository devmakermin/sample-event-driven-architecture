function insertNegativeDB(data) {
	let client = daoManager.mongoConnect.MongoNativeConnect();

	async function main() {
		await client.connect();
		let db = client.db(CONFIG.MONGO_DB_NAME);
		let collection = db.collection(global.collectionName);

		const insertResult = await collection.insertOne(data);

		return 'insert save user data';
	}

	main()
		.then()
		.catch(console.error)
		.finally(() => client.close());
}

module.exports = {
    insertNegativeDB
};
