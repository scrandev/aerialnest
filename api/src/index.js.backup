exports.lambdaHandler = async (event, context) => {
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
            message: "Aerial Nest API is running!",
            timestamp: new Date().toISOString()
        })
    };
};
