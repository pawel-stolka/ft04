const consts = {
    mongoString: process.env.DB_CONN_STR_QA2,
    secretString: process.env.SECRET_KEY,

    apiUrl: 'http://localhost:9999',//'http://localhost:9011',
    // apiUrl: 'https://authtemplate.herokuapp.com/',

    frontUrl: 'http://localhost:4200',
    // frontUrl: 'http://pablodev.pl',
    port: 9999,
    wsPort: 5555
}

exports.consts = consts
// to make a difference