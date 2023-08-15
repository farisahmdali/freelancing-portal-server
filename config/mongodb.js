const mongoClient = require('mongodb').MongoClient
const state = {
    db: null
}

module.exports.connect = function (done) {
    const url = "mongodb+srv://farisahmdali:F0cQp78nOautmBUH@cluster0.0cu3o3a.mongodb.net/?retryWrites=true&w=majority"
    const dbname = 'freelancing-portal'



    mongoClient.connect(url, (err, data) => {
        if (err) {

            return done(err)
        }
        state.db = data.db(dbname)


    })
    done()

}


module.exports.get = function () {
    return state.db
}