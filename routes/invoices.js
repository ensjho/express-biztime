const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

//gets all invoices and responds as JSON 

router.get("/", async function(req,res,next){
  try{
    let result = await db.query(
      `SELECT id,comp_code 
      FROM invoices`
    )
    return res.json({invoices:result.rows});
  }
  catch(err){
    return next(err);
  }
})

/*Returns obj on given invoice.
If invoice cannot be found, returns 404.
Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
*/

router.get("/:id", async function(req,res,next){
  try{
    let invoiceId = req.params.id;
    let invoiceResult = await db.query(
      `SELECT id,
              amt, 
              paid, 
              add_date, 
              paid_date,
              comp_code
      FROM invoices
      WHERE id= $1`,
      [invoiceId]
    )

    let companyResult = await db.query(
      `SELECT code, name, description
      FROM companies
      WHERE code=$1
       `,
       [invoiceResult.rows[0].comp_code]
    )
    let invoice = invoiceResult.rows[0];
    delete invoice.comp_code;
    invoice.company = companyResult.rows;


    return res.json({invoice})

  }
  catch(err){
    return next(err)
  }
})

/*Adds an invoice.
Needs to be passed in JSON body of: {comp_code, amt}
Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}*/ 

router.post("/", async function(req,res,next){
  try{
    let {comp_code,amt} = req.body;

    let result = await db.query(
      `INSERT INTO invoices (comp_code,amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code,amt]
    )
    return res.json({invoice:result.rows[0]})
  }
  catch(err){
    return next(err)
  }

})

/* Updates an invoice.

If invoice cannot be found, returns a 404.
Needs to be passed in a JSON body of {amt}
Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}*/ 

router.put("/:id", async function(req, res, next){
  try{
    let invoiceId = req.params.id;
    let {amt} = req.body

    let result = await db.query(
      `UPDATE invoices
      SET amt = $1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt,invoiceId]
    )
    if(result.rows.length !== 0){
      return res.json({invoice:result.rows[0]})
    } else {
      throw new ExpressError("Invoice doesn't exist!",404)
    }

  }
  catch(err){
    return next(err)
  }
})

router.delete("/:id", async function(req,res,next){
  try{
    let invoiceId = req.params.id;
    let result = await db.query(
      `DELETE FROM invoices
      WHERE id=$1
      RETURNING id`,
      [invoiceId]
    )
    if(result.rows[0].id === Number(invoiceId)) {
      return res.json({status:"invoice deleted!"})
    }
    else{
      throw new ExpressError("Invoice Doesn't Exist",404)
    }
  }
  catch(err){
    return next(err);
  }

})





module.exports = router