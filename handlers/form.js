/**
 * Project: uenrrobotics
 * File: form
 * Created by Pennycodes on 9/14/2022.
 * Copyright uenrrobotics
 */

const formidable = require('formidable')

 const isValidFile = file => {
    const type = file.originalFilename.split(".").pop().toLowerCase()
    const validTypes = ["jpg", "jpeg", "png", "webp"]
    return validTypes.indexOf(type) !== -1

}

module.exports = (req, res, next) => {
    const form = formidable({
        allowEmptyFiles: false
    })

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err)
            return
        }

        if (!files.file) {
           req.flash("error", "Please select a file to upload")
              res.redirect(req.originalUrl)
            return;
        }

        if (!isValidFile(files.file)) {
            req.flash("error", "Invalid file type only images and webp are allowed")
            res.redirect(req.originalUrl)
            return;
        }

        req.body.fields = fields
        req.body.files = files
        next()
    })

}
