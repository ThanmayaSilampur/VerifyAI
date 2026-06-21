const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.static("frontend"));

app.listen(port, function(){
    console.log("App running on http://localhost:" + port);
});