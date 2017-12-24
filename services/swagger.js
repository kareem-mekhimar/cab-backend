const swaggerJSDoc = require("swagger-jsdoc");



let swaggerDefinition = {
    info: {
        title: 'Cab Api',
        version: '1.0.0',
        description: 'Cab Rest Api',
    },
    host: '74.207.254.193:3000',
    basePath: '/api'
    
};


let options = {
    swaggerDefinition: swaggerDefinition,
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

exports.swaggerSpec = swaggerSpec ;
