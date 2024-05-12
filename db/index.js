const mongoose = require('mongoose');

//Schema
const productSchema = new mongoose.Schema({
    name:String,
    price:Number,
    imageLink:String,
    description:String,
    brand:String
})

const cartSchema = new mongoose.Schema({
    addedProduct:[{type:mongoose.Schema.Types.ObjectId, ref:'Product'}],
    totalQuantity: {type: Number , default:0},
    totalPrice: {type: Number, default: 0}
})


const featuredPhoneSchema = new mongoose.Schema({
    featuredProduct:[{type:mongoose.Schema.Types.ObjectId, ref:'Product'}]
})


const filterSchema = new mongoose.Schema({
    filterProduct:[{type:mongoose.Schema.Types.ObjectId, ref:'Product'}]
})


//modal
const Product = mongoose.model('Product', productSchema);
const Cart = mongoose.model('Cart', cartSchema);
const FeaturedPhone = mongoose.model('FeaturedPhone', featuredPhoneSchema);
const Filter = mongoose.model('Filter', filterSchema);


module.exports = {
    Product,
    Cart,
    FeaturedPhone,
    Filter
}