const express = require('express');
const {Product, Cart, FeaturedPhone, Filter} = require("../db/index");
const router = express.Router();
require('dotenv').config();
const key=process.env.STRIPE_KEY;
const stripe = require('stripe')(key)


// Stripe payment integration
router.post('/create-checkout-session', async( req, res) => {
  const {products} = req.body;

  const lineItems = products.map((product)=>({
    price_data:{
      currency:'inr',
      product_data:{
        name:product.productName
      },
      unit_amount:product.productPrice * 100,
    },
    quantity:product.productQuantity
  }))
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items:lineItems,
    mode:"payment" ,
    success_url:"http://localhost:5173/success",
    cancel_url: "http://localhost:5173/cancel"
  })

  res.json({id:session.id});
})

// Adding product to database
router.post('/createProduct', async (req,res) =>{
  const product = req.body;
  
  
  const newProduct = new Product(product)
  await newProduct.save();

  res.json({msg:"Product added sucessfully", product: newProduct});
})


// Fetching product
router.get('/product', async (req, res)=> {
  const allProduct = await Product.find({})
  await Filter.deleteMany({});
  res.json({products:allProduct});
})


// Fetching single product
router.get('/product/:productId', async (req, res) =>{
    const productID= req.params.productId;
    console.log(productID);

    const product = await Product.findOne({_id:productID});
    if(product){
        res.json({prod:product})
      }else{
        res.json({msg:"Product not found"});
      }
})


// Adding product to cart
router.get('/product/addtocart/:productId', async (req, res) => {
   const productID = req.params.productId;
   const product = await Product.findOne({_id:productID});
   console.log("Product",product);
   if(product){
    
    const cartProduct= await Cart.findOne({addedProduct:[product._id]}).populate('addedProduct');
    console.log("Cart Product",cartProduct);
  
  
    if(!cartProduct){
   

    const newProduct = new Cart({addedProduct:[product._id]})
    newProduct.totalQuantity =1;
    newProduct.totalPrice = product.price;
    await newProduct.save();    
    const cartData = await Cart.findById(newProduct._id).populate('addedProduct');
    console.log("Cart Product after adding", cartData);
   }
    else if(cartProduct){
     
      cartProduct.totalQuantity+=1; 
       cartProduct.totalPrice= product.price * cartProduct.totalQuantity;
       await cartProduct.save();
       console.log(cartProduct);
     }
    
     const count = await Cart.countDocuments();
    res.json({msg:"Item added to the cart", itemCount:count});
   }else{
    res.json({msg:"Item not added"})
   }
})


// Fetching cart
router.get('/cart', async (req, res) => {
  var sum=0;
 
  const totalCartPrice = await Cart.find({}, {totalPrice: 1, _id:0 });
  console.log("Total Price Array: ",totalCartPrice);
   
  for(let i=0; i<totalCartPrice.length; i++)
  {
     sum += totalCartPrice[i].totalPrice   
  }
 
  const cartProducts = await Cart.find({}).populate('addedProduct');
  res.json({msg:"Cart Products",
            cart:cartProducts,
            total:sum})

})


//Increase quantity in cart
router.post('/increaseitem', async (req, res) => {
     const {productId} = req.body;

     const product = await Cart.findById(productId).populate('addedProduct');
     console.log(product);
    
     product.totalQuantity += 1;
     product.totalPrice = product.addedProduct[0].price * product.totalQuantity;
     await product.save();

     var sum=0;
 
     const totalCartPrice = await Cart.find({}, {totalPrice: 1, _id:0 });
     console.log("Total Price Array: ",totalCartPrice);
      
     for(let i=0; i<totalCartPrice.length; i++)
     {
        sum += totalCartPrice[i].totalPrice   
     }

     const cartProducts = await Cart.find({}).populate('addedProduct');
     res.json({msg:'Increase Quantity', cart:cartProducts, total:sum});
})


//Decrease quantity in cart
router.post('/decreaseitem', async (req, res) => {
  const {productId} = req.body;

  const product = await Cart.findById(productId).populate('addedProduct');
  console.log(product);
 
  product.totalQuantity -= 1;
  product.totalPrice = product.addedProduct[0].price * product.totalQuantity;
  await product.save();

  var sum=0;
 
  const totalCartPrice = await Cart.find({}, {totalPrice: 1, _id:0 });
  console.log("Total Price Array: ",totalCartPrice);
   
  for(let i=0; i<totalCartPrice.length; i++)
  {
     sum += totalCartPrice[i].totalPrice   
  }

  const cartProducts = await Cart.find({}).populate('addedProduct');
  res.json({msg:'decrease Quantity', cart:cartProducts, total:sum});
})


//Remove item
router.delete('/delete/:productId', async (req, res) =>{
   const productId= req.params.productId;

   await Cart.findByIdAndDelete(productId);

   const cartProducts = await Cart.find({}).populate('addedProduct');
   const count = await Cart.countDocuments();

   var sum=0;
 
  const totalCartPrice = await Cart.find({}, {totalPrice: 1, _id:0 });
  console.log("Total Price Array: ",totalCartPrice);
   
  for(let i=0; i<totalCartPrice.length; i++)
  {
     sum += totalCartPrice[i].totalPrice   
  }
 
  res.json({msg:'Remove Product', cart:cartProducts, itemCount:count, total:sum});
})


// FeaturedPhone
router.get('/featuredphone', async (req, res)=>{
  

  // const firstSixDocs = await Product.find({}).limit(6);
  // console.log(firstSixDocs);
  
  // var newProduct = new FeaturedPhone();
  
  // for(let i=0; i<firstSixDocs.length; i++)
  // {
    
  //   // var newProduct = new FeaturedPhone({featuredProduct:[firstSixDocs[i]._id]});
  //  newProduct.featuredProduct.push(firstSixDocs[i]._id);
  //  await newProduct.save();
  // }
    

    const phone = await FeaturedPhone.find({}).populate('featuredProduct');
    const featuredPhone = phone[0].featuredProduct;
    res.json({msg:'Featured Phones',
             Phones:featuredPhone});
})


//Price Filter
router.post('/pricevalue', async (req, res)=> {
  const {price} = req.body;
  console.log(price);
  let filterArray=[]
  const count = await Filter.countDocuments();
  console.log("Count: ", count);
  if(count===0){
    // filterArray = await Product.find(product => product.price<= price)
    const everyProdPrice = await Product.find({}, {price: 1}).sort({price: -1});
    console.log(everyProdPrice);
    for(let i=0;i<everyProdPrice.length; i++){
      if(everyProdPrice[i].price<= price){
        const product = await Product.findById(everyProdPrice[i]._id);
        console.log(product);
        filterArray.push(product);
      }
      
    }
  }
  else {
    // filterArray = Filter.filter(product => product.price<=price);

    const filterData = await Filter.find({}).populate('filterProduct');
    console.log("FilterData: ", filterData);
     
     const priceInFilterData = filterData[0].filterProduct;
     console.log(priceInFilterData);

     for(let i=0; i<priceInFilterData.length; i++){
       if(priceInFilterData[i].price<=price){
        filterArray.push(priceInFilterData[i]);
       }
     }

  }
  res.json({msg:"Filtered Product By Price", nArr:filterArray});
})


// Brand Filter
router.post('/brandFilter', async (req, res) => {
  const {brand, price} = req.body;
  console.log(brand + "---- " + price);
  // const filterBrand = []
  
  const productBrand = await Product.find({}, {brand: 1, price: 1});
  console.log(productBrand);
   
  const newProduct = new Filter();
  for(let i=0; i<productBrand.length; i++)
  {
    if(productBrand[i].brand === brand && productBrand[i].price <= price){
      newProduct.filterProduct.push(productBrand[i]._id);
      await newProduct.save(); 
    }
   
  }
 
   const brandFilter = await Filter.find({}).populate('filterProduct');
   var product = [];
   for(let i=0; i<brandFilter.length;i++){
    let length = brandFilter[i].filterProduct.length;
    for(let j=0; j<length; j++){
      product.push(brandFilter[i].filterProduct[j]);  // converted document containing filteredProduct to an array of object filteredProduct.
    }
      
   }
          
   console.log(product);
  res.json({msg:"Filtered Brand", bArr:product});
})


// Remove brand filter
router.post('/removeBrandFilter', async (req, res) => {
  const {brand, price} = req.body;
  console.log(brand);
  let removeBrand = [];

  // FILTERARR=FILTERARR.filter(product=>product.brand!=brand);
  // console.log(FILTERARR);
  const removeBrandFilter = await Filter.find({}).populate('filterProduct');

  for(let i=0; i<removeBrandFilter.length; i++){
    if(removeBrandFilter[i].filterProduct[0].brand===brand)
    {
      await Filter.deleteOne(removeBrandFilter[i]._id);
    }
  }
  
 
  
  const count = await Filter.countDocuments();
  if(count===0)
  {
    // const filterArray = await Product.find({});
    // console.log(filterArray)
    // res.json({msg:"Removed Brand", rbArr:filterArray});
    let filterArray =[];
    const everyProdPrice = await Product.find({}, {price: 1}).sort({price: -1});
    console.log(everyProdPrice);
    for(let i=0;i<everyProdPrice.length; i++){
      if(everyProdPrice[i].price<= price){
        const product = await Product.findById(everyProdPrice[i]._id);
        console.log(product);
        filterArray.push(product);
      }
      
    }

    res.json({msg:"Removed Brand", rbArr:filterArray});
  }
  else {
    const filterArray = await Filter.find({}).populate('filterProduct');
    var product = [];
   for(let i=0; i<filterArray.length;i++){
    let length = filterArray[i].filterProduct.length;
    for(let j=0; j<length; j++){
      product.push(filterArray[i].filterProduct[j]);  // converted document containing filteredProduct to an array of object filteredProduct.
    }
      
   }
    console.log(filterArray)
  res.json({msg:"Removed Brand", rbArr:product});
  }
})


module.exports = router;
