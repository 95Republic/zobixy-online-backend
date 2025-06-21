module.exports.responseRouter = (res,code,data) => {
    return res.status(code).json(data)
}