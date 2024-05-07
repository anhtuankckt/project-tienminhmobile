const sliderModel = require('../models/sliderModel')
const bannerModel = require('../models/bannerModel')
const userModel = require('../models/userModel')
const paginate = require('../../common/paginate')
const timesAgo = require('../../libs/timesAgo')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

/** SLIDERS */
const index = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 5
  const skip = page * limit - limit

  const sliders = await sliderModel.find().sort({ _id: -1 }).skip(skip).limit(limit)

  const totalRows = await sliderModel.countDocuments()
  const totalPages = Math.ceil(totalRows / limit)

  const user = await userModel.findOne({ email: req.session.email })
  const role = user?.role

  res.render('admin/advertises/sliders/slider', {
    sliders,
    currentPage: page,
    totalPages,
    pages: paginate(page, totalPages),
    timesAgo,
    role
  })
}

const createSlider = async (req, res) => {
  res.render('admin/advertises/sliders/add_slider', { data: {} })
}

const storeSlider = async (req, res) => {
  const { name } = req.body
  const { thumbnails } = req.files

  if (thumbnails.length > 8) {
    const error = 'Số lượng slide thêm vào phải ít hơn hoặc bằng 8 ảnh!'
    return res.render('admin/advertises/sliders/add_slider', { data: { error } })
  }

  // function kiểm tra ảnh
  const isImage = (fileName) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png']
    const ext = path.extname(fileName).toLowerCase()
    return imageExtensions.includes(ext)
  }

  if (thumbnails && thumbnails.length > 0 && thumbnails.length <= 8) {
    const random = uuidv4().slice(0, 6)
    const thumbnailsArray = []

    // Lặp qua từng ảnh để kiểm tra kích thước
    let index = 1
    for (let thumbnail of thumbnails) {
      // Nếu file không phải ảnh => Trả về giao diện + cảnh báo
      if (!isImage(thumbnail.originalname)) {
        const error = 'File được thêm phải là ảnh. Hãy kiểm tra lại!'
        return res.render('admin/advertises/sliders/add_slider', { data: { error } })
      }

      const fileName = `${index}_${random}_${thumbnail.originalname}`
      thumbnailsArray.push(fileName)
      fs.renameSync(thumbnail.path, path.resolve('src/public/uploads/images/sliders', fileName))

      index++
    }

    const newThumbnails = {
      name,
      thumbnails: thumbnailsArray
    }

    await sliderModel.create(newThumbnails)
    res.redirect('/admin/advertises/sliders')
  }
}

const delSliders = async (req, res) => {
  const { ids } = req.params
  if (!ids) res.redirect('/admin/advertises/sliders')

  const arrIds = ids.split(',')
  for (let id of arrIds) {
    const slider = await sliderModel.findById(id)

    const thumbnails = slider?.thumbnails

    await sliderModel.deleteOne({ _id: id })

    if (thumbnails) {
      const filePaths = thumbnails.map(i => path.resolve('src/public/uploads/images/sliders', i))
      filePaths.forEach(j => {
        if (fs.existsSync(j)) {
          fs.unlinkSync(j)
        }
      })
    }
  }

  res.redirect('/admin/advertises/sliders')
}

const aprroveSlider = async (req, res) => {
  const { id } = req.params

  await sliderModel.updateOne({ _id: id }, { allow: true })

  await sliderModel.updateMany({ _id: { $ne: id } }, { allow: false })

  res.redirect('/admin/advertises/sliders')
}

const offSlider = async (req, res) => {
  const { id } = req.params

  await sliderModel.updateOne({ _id: id }, { allow: false })

  res.redirect('/admin/advertises/sliders')
}

/** BANNERS */
const banner = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 5
  const skip = page * limit - limit

  const banners = await bannerModel.find().sort({ _id: -1 }).skip(skip).limit(limit)

  const totalRows = await bannerModel.countDocuments()
  const totalPages = Math.ceil(totalRows / limit)

  const user = await userModel.findOne({ email: req.session.email })
  const role = user?.role

  res.render('admin/advertises/banners/banner', {
    banners,
    currentPage: page,
    totalPages,
    pages: paginate(page, totalPages),
    timesAgo,
    role
  })
}

const createBanner = async (req, res) => {
  res.render('admin/advertises/banners/add_banner', { data: {} })
}

const storeBanner = async (req, res) => {
  const { name } = req.body
  const { thumbnails } = req.files

  // function kiểm tra ảnh
  const isImage = (fileName) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png']
    const ext = path.extname(fileName).toLowerCase()
    return imageExtensions.includes(ext)
  }

  if (thumbnails.length > 8) {
    const error = 'Số lượng banner thêm vào phải ít hơn hoặc bằng 8 ảnh!'
    return res.render('admin/advertises/banners/add_banner', { data: { error } })
  }

  if (thumbnails && thumbnails.length > 0 && thumbnails.length <= 8) {
    const random = uuidv4().slice(3, 6)
    const thumbnailsArray = []

    // Lặp qua từng file để kiểm tra
    let index = 1
    for (let thumbnail of thumbnails) {
      // Kiểm tra file không phải ảnh => giao diện
      if (!isImage(thumbnail.originalname)) {
        const error = 'Banner được thêm vào phải là ảnh. Hãy kiểm tra lại!'
        return res.render('admin/advertises/banners/add_banner', { data: { error } })
      }

      const fileName = `${index}_${random}_${thumbnail.originalname}`

      thumbnailsArray.push(fileName)

      fs.renameSync(thumbnail.path, path.resolve('src/public/uploads/images/banners', fileName))

      index++
    }

    const newThumbnails = {
      name,
      thumbnails: thumbnailsArray
    }

    await bannerModel.create(newThumbnails)
    res.redirect('/admin/advertises/banners')
  }
}

const aprroveBanner = async (req, res) => {
  const { id } = req.params

  await bannerModel.updateOne({ _id: id }, { allow: true })

  await bannerModel.updateMany({ _id: { $ne: id } }, { allow: false })

  res.redirect('/admin/advertises/banners')
}

const offBanner = async (req, res) => {
  const { id } = req.params

  await bannerModel.updateOne({ _id: id }, { allow: false })

  res.redirect('/admin/advertises/banners')
}

const delBanners = async (req, res) => {
  const { ids } = req.params
  const arrIds = ids.split(',')
  for (let id of arrIds) {
    const banner = await bannerModel.findById(id)

    const thumbnails = banner?.thumbnails

    await bannerModel.deleteOne({ _id: id })

    if (thumbnails) {
      const filePaths = thumbnails.map(i => path.resolve('src/public/uploads/images/banners', i))
      filePaths.forEach(j => {
        if (fs.existsSync(j)) {
          fs.unlinkSync(j)
        }
      })
    }
  }

  res.redirect('/admin/advertises/banners')
}

module.exports = {
  index,
  banner,
  createSlider,
  createBanner,
  storeSlider,
  storeBanner,
  aprroveSlider,
  aprroveBanner,
  offSlider,
  offBanner,
  delSliders,
  delBanners
}