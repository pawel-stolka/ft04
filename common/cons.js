const consts = {
    mongoString: process.env.DB_CONN_STR_QA2,
    secretString: process.env.SECRET_KEY,

    apiUrl: 'https://auth04.herokuapp.com/',

    frontUrl: 'http://pablodev.pl',

    port: 9999 || process.env.PORT,
    // wsPort: 5555 || process.env.PORT + 1
}

exports.consts = consts