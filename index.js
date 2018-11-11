var http = require("http");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mysql = require("mysql");
const JSON = require('circular-json');
var fs = require('fs');

const jsonWebToken = require('jsonwebtoken');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

var port = process.env.por || 3000;
var router = express.Router();
const myJWTSecretKey = 'my-secret-key';

var con = mysql.createConnection({
    host: 'localhost', //mysql database host name
    user: 'root', //mysql database user name
    password: '', //mysql database password
    database: 'handisale'
});
con.connect(function (err) {
    if (err) throw err
    console.log('You are now connected with mysql database...')
})
var code;
var pdata = {
    "Data": ""
};


app.post('/login', function (req, res) {
    var email = req.body.email;
    var pass = req.body.password;
    try {
        //con.query("SELECT salesperson.id,salesperson.code,salesperson.password,salesperson.username,salesperson.name,salesperson.addrLine1,salesperson.addrLine2,salesperson.telephone,salesperson.mobile,salesperson.email,salesperson.Company-Code,company.code,company.company-name,company.addrsLine_1,company.addrsLine_2 ,company.city ,company.telephone  from salesperson  INNER JOIN company ON salesperson.Company-Code=company.code  WHERE salesperson.UserName =? and salesperson.Password =? LIMIT 1", [email, pass], function (err, rows, fields) {
            con.query("SELECT *  from user   WHERE user.UserName =? and user.Password =? LIMIT 1", [email, pass], function (err, rows, fields) {
                if (err) throw err;
          
            if (rows.length != 0) {

                const user = {
                    un: email,
                    pw: pass
                };

                pdata["Data"] = rows;

                var data = rows;
                var ddata =data[0];
                const UserName =ddata["UserName"];
                code =ddata["Code"];
                var type = ddata["type"];
                var strsplt =code.split("SP");
                const company =strsplt[0];
               const spcode="SP"+strsplt[1];



   
if(type=="SP"){



con.query("SELECT salesperson.id,salesperson.code,salesperson.password,salesperson.username,salesperson.name,salesperson.addrLine1,salesperson.addrLine2,salesperson.telephone,salesperson.mobile,salesperson.email,salesperson.Company_Code,company.company_name,company.addrsLine_1 as Company_addrsLine_1,company.addrsLine_2 as Company_addrsLine_2,company.city as Company_city,company.telephone as Company_telephone from salesperson  INNER JOIN company ON salesperson.Company_Code=company.code  WHERE salesperson.code =? and salesperson.Company_Code =? LIMIT 1", [spcode, company], function (err, row, fields) {
    if (err) throw err;

if (row.length != 0) {

   // sign with default (HMAC SHA256) 
    const token = jsonWebToken.sign(user, myJWTSecretKey);
    res.json({
        error: false,
        token: token,
        message: 'Login Successfull',
        data: row
    });




}
});





}




               
            } else {

                res.json({
                    error: true,
                    message: 'Login Failed!.Email or password is incorrect.'

                });
            }
        });
    } catch (error) {
        return res.send({ error: true, data: error, message: 'Error occured while parsing the login values' });
    }


});






app.get('/', function (req, res) {
    res.json({
        error: true,
        data: "Welcome"
    });

}
);




function ensureToken(req, res, next) {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
        return res.status(400).send({ error: true, message: 'Please provide token' });
    }

    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}




app.get('/product', ensureToken, function (req, res) {
    jsonWebToken.verify(req.token, myJWTSecretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {

      
            try {
                
             



                // mysql query
                con.query('SELECT * FROM salesperson_items where Salesperson_Code =?', [code], function (error, results, fields) {
                    if (error) throw error;
                    if (results.length > 0) {
                      console.log(results.length);
                        var content = [];
                        step(0);
                        function step(j) {
                            if (j < results.length) {

                                var sales_person_items = results[j];
                                //console.log(sales_person_items);
                                var order_items_qty = sales_person_items["Order_Items_Qty"];
                                var product_Code = sales_person_items["Product_Code"];



                                con.query('SELECT product.Product_Code,product.name AS Product_Name, product.Unit_Price As Unit_Price , product.Measure_Unit, product.Category_ID ,product_category.Category_ID,product_category.Name As Category_Name ,product_measure.ID,product_measure.Name AS Measure_Unit_Name from product INNER JOIN product_category ON product.Category_ID  = product_category.Category_ID  INNER JOIN product_measure ON product.Measure_Unit = product_measure.ID where product.Product_Code =? LIMIT 1 ', [product_Code], function (errors, response, fields) {
                                    if (errors) throw errors;
                                    if (response.length > 0) {
                                        
                                        var product_detail = response[0];

                                        //console.log(product_detail);
                                        var unit_price = product_detail["Unit_Price"];
                                   
                                        var product_name = product_detail["Product_Name"];
                                        var product_cat_name =product_detail["Category_Name"];
                                        var measure = product_detail["Measure_Unit_Name"];



                                        var obj = [{

                                            "code": product_Code,
                                            "name": product_name,
                                            "qty": order_items_qty,
                                            "price": unit_price,
                                            "category": product_cat_name,
                                            "measure": measure
                                        }];
                                        //console.log(obj);

                                       content.push(obj);
                                        obj = null;
                                       
                                       step(j + 1);
                                       



                                    } else {
                                       // console.log("Query does not working bro");
                                        return res.send({ error: true,  message: 'ERROR  ' });
                                    }
                                });


                                



                                


                            }
                            else {
                                return res.send({ error: false, data: content, message: 'success' });
                                console.log(content);


                            }



                        }











                    } else {
                        return res.send({ error: true, data: results, message: 'empty' });
                    }
                    //console.log(content);
                });

            } catch (error) {
                return res.send({ error: true, data: error, message: 'Error occured while parsing the product values' });
            }



        }







    });
});


app.post('/order', ensureToken, function (req, res) {
    jsonWebToken.verify(req.token, myJWTSecretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            try {

                var jsondata = req.body.orders;
                // console.log(jsondata);


                var count = Object.keys(jsondata).length;


                step(0);
                function step(j) {
                    var oderitemscople = false;
                    if (j < count) {

                        var orders = req.body.orders[j];

                        var order_code = orders['order_code'];
                        var str = order_code.split("OR");
                        var code = "CM" + str[0] + "OR";     //ok
                        var codecount = str[1];          //ok

                        var order_timestamp = orders['order_timestamp'];
                        var timesplit = order_timestamp.split("_");
                        var orderdate = timesplit[0];  //ok
                        var ordertime = timesplit[1];   //ok

                        var ordervalue = orders['ordervalue'];
                        var deliverydate = orders['delivery_date']; //ok

                        var advancevalue = orders['order_advance'];     //ok

                        if (!advancevalue.equal("")) {



                        }


                        var customer_idcustomer = orders['customer_id'];    //ok

                        var sales_person_idsales_person_name = orders['sales_person'];      //should remove
                        var oderitems = orders['order_items'];      //ok



                        var prodata = pdata["Data"];
                        var salep = prodata[0];
                        var sales_person_idsales_person = salep["idsales_person"];          //ok


                        //console.log(oderitems);

                        //Insert into order product table


                        con.query("INSERT INTO order_product(order_code,order_code_count,order_date,order_time,order_value,deliveryDate,advance_value,sales_person_idsales_person,customer_idcustomer) VALUES (?,?,?,?,?,?,?,?,?)", [code, codecount, orderdate, ordertime, ordervalue, deliverydate, advancevalue, sales_person_idsales_person, customer_idcustomer], function (error, results, fields) {


                            if (error) throw error;
                            else {



                                var idorder = results.insertId;
                                //console.log(idorder);
                                stepinside(0);
                                function stepinside(k) {

                                    // console.log(oder_item);
                                    var countproduct = Object.keys(oderitems).length;

                                    if (k < countproduct) {

                                        var oderitem = oderitems[k];

                                        var orderitemsqty = oderitem['order_item_qty'];



                                        // console.log(orderitemsqty);
                                        con.query("INSERT INTO order_items(order_items_qty,order_items_price,change_qty,product_idproduct,order_product_idorder) VALUES (?,?,?,?,?)", [orderitemsqty, oderitem['oderitemprice'], oderitem['changeqty'], oderitem['productid'], idorder], function (error, result, fields) {

                                            if (error) throw error;
                                            else {

                                                //  console.log(result);

                                            }


                                        });

                                        stepinside(k + 1);



                                    }

                                    else {


                                    }

                                }
                            }
                        });













                        step(j + 1);






                    }
                    else {

                        return res.send({ error: false, data: '', message: 'success' });
                        // console.log(content);



                    }



                }












            }


            catch (error) {
                return res.send({ error: true, data: error, message: 'Error occured while parsing the order values' });
            }


        }


    });
});







app.get('/customer', ensureToken, function (req, res) {

    jsonWebToken.verify(req.token, myJWTSecretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {

            var prodata = pdata["Data"];
            var salep = prodata[0];
            var company_id = salep["company_idcompany"];



            con.query('select * from customer  where company_idcompany=? ', [company_id], function (error, results, fields) {
                if (error) throw error;
                else {
                    return res.send({ error: false, data: results, message: 'success' });
                    // res.send(error:false,data:(JSON.stringify(results)),);
                }
            });

        }






    });
});




app.get('/receipt', ensureToken, function (req, res) {

    jsonWebToken.verify(req.token, myJWTSecretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {

            var prodata = pdata["Data"];
            var salep = prodata[0];
            var salep_id = salep["idsales_person"];


            con.query('select * from receipt INNER JOIN (select sale.sales_person_idsales_person , sale.customer_idcustomer , sale.idsale , customer.customer_name from sale INNER JOIN customer ON customer.idcustomer =sale.customer_idcustomer  where  sale.sales_person_idsales_person=?)As salp ON salp.idsale =receipt.sale_idsale ', [salep_id], function (error, results, fields) {
                if (error) throw error;
                else {
                    return res.send({ error: false, data: results, message: 'success' });
                    // res.send(error:false,data:(JSON.stringify(results)),);
                }
            });

        }






    });
});




app.get('/advance', ensureToken, function (req, res) {

    jsonWebToken.verify(req.token, myJWTSecretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {

            var prodata = pdata["Data"];
            var salep = prodata[0];
            var salep_id = salep["idsales_person"];


            con.query('select * from advance INNER JOIN (SELECT order_product.customer_idcustomer,order_product.order_code,order_product.order_code_count,order_product.idorder,customer.idcustomer,customer.customer_name,customer.city FROM order_product INNER JOIN customer ON  customer.idcustomer =  order_product.customer_idcustomer)As sal ON sal.idorder =advance.order_product_idorder WHERE advance.sales_person_idsales_person=?', [salep_id], function (error, results, fields) {
                if (error) throw error;
                else {
                    return res.send({ error: false, data: results, message: 'success' });
                    // res.send(error:false,data:(JSON.stringify(results)),);
                }
            });

        }






    });
});



app.get('/discount', ensureToken, function (req, res) {
    jsonWebToken.verify(req.token, myJWTSecretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var prodata = pdata["Data"];
            var salep = prodata[0];
            var salep_id = salep["idsales_person"];
            // mysql query
            con.query(
                "SELECT * FROM sale INNER JOIN customer ON customer.idcustomer = sale.customer_idcustomer where sale.sales_person_idsales_person =?",
                [salep_id],
                function (error, results, fields) {
                    if (error) throw error;
                    if (results.length > 0) {

                        var content = [];

                        step(0);
                        function step(j) {
                            if (j < results.length) {
                                sale_items = results[j];
                                var sale_id = sale_items["idsale"];
                                content.push(results[j]);
                                console.log(content);
                                con.query(
                                    "SELECT * from sales_item INNER JOIN (SELECT  warehouse_has_product.unit_price, product.name, warehouse_has_product.idproduct from warehouse_has_product INNER JOIN product ON warehouse_has_product.idproduct = product.idproduct) AS t ON t.idproduct = sales_item.product_idproduct where sales_item.sale_idsale =?",
                                    [sale_id],
                                    function (error, result1, fields) {
                                        if (error) throw error;
                                        if (result1.length > 0) {
                                            var sale_items = result1[0];

                                            let product_name = sale_items["name"];
                                            var unit_price = sale_items["unit_price"];
                                            let sales_item_qty = sale_items["sales_item_qty"];
                                            let item_sales_value = sales_item_qty * unit_price;
                                            let item_discount_qty = sale_items["item_discount_qty"];
                                            let item_discount_rupees =
                                                sale_items["item_discount_rupees"];
                                            let item_discount_prsntge =
                                                sale_items["item_discount_prsntge"];

                                            var obj = [
                                                {
                                                    name: product_name,
                                                    qty: sales_item_qty,
                                                    price: unit_price,
                                                    item_sales_value: item_sales_value,
                                                    item_discount_qty: item_discount_qty,
                                                    item_discount_rupees: item_discount_rupees,
                                                    item_discount_prsntge: item_discount_prsntge
                                                }
                                            ];

                                            content.push(obj);
                                            // console.log(obj);
                                            obj = null;
                                            step(j + 1);
                                        } else {
                                            return res.send({
                                                error: true,
                                                data: results,
                                                message: "Discount"
                                            });
                                        }
                                    }
                                );
                            } else {
                                return res.send({
                                    error: false,
                                    data: content,
                                    message: "Discount"
                                });
                                console.log(content);
                            }
                        }

                    } else {
                        return res.send({ error: true, data: results, message: "empty" });
                        // console.log()
                    }
                }
            );


        }







    });
});




app.post('/sale', ensureToken, function (req, res) { 
    jsonWebToken.verify(req.token, myJWTSecretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else { 
            
            try {

            

            var jsondata = req.body.sale;
            // console.log(jsondata);




            var count = Object.keys(jsondata).length;
            //  console.log(req.body.order[0]);
            //console.log(count);

            step(0);
            function step(j) {

                if (j < count) {

                    var sale = req.body.sale[j];

                    var salecodesplit= sale['invoice_code'].split("IV");

                    var sales_code="CM"+salecodesplit[0]+"IV";                                    //ok
                   // var sales_code = sale['sales_code'];
                   // var sale_code_count = sale['sale_code_count'];
                    var sale_code_count =salecodesplit[1] ;                                      //ok

                    var start_sale_date = sale['start_sale_date'];
                    var end_sale_date = sale['end_sale_date'];
                    var sale_time = sale['sale_time'];
                    var sales_value = sale['sales_value'];
                    var total_due = sale['total_due'];
                    var trade_discount = sale['trade_discount'];
                    var NBT = sale['NBT'];
                    var CESS = sale['CESS'];
                    var VAT = sale['VAT'];
                    var status = sale['status'];
                    var discount_value_rupees = sale['discount_value_rupees'];
                    var discount_value_prsntge = sale['discount_value_prsntge'];
                    var order_idorder = sale['order_idorder'];
                    var sales_person_idsales_person = sale['sales_person_idsales_person'];
                    var customer_idcustomer = sale['customer_idcustomer'];

                    var sale_items = sale['products'];


                    //console.log(oderitems);

                    //Insert into order product table


                    con.query("INSERT INTO sale(sales_code,sale_code_count,start_sale_date,end_sale_date,sale_time,sales_value,total_due,trade_discount,NBT,CESS,VAT,status,discount_value_rupees,discount_value_prsntge,order_idorder,sales_person_idsales_person,customer_idcustomer) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [sales_code, sale_code_count, start_sale_date, end_sale_date, sale_time, sales_value, total_due, trade_discount, NBT, CESS, VAT, status, discount_value_rupees, discount_value_prsntge, order_idorder, sales_person_idsales_person, customer_idcustomer], function (error, results, fields) {


                        if (error) throw error;
                        else {
                            console.log(results.insertId);
                            var idsale = results.insertId;
                            stepinside(0);



                            function stepinside(k) {

                                // console.log(oder_item);
                                var countproduct = Object.keys(sale_items).length;

                                if (k < countproduct) {

                                    var saleitem = sale_items[k];




                                    con.query("INSERT INTO sales_item(sales_item_qty,item_discount_qty,item_discount_rupees,item_discount_prsntge,sale_idsale,product_idproduct) VALUES (?,?,?,?,?,?)", [saleitem['sales_item_qty'], saleitem['item_discount_qty'], saleitem['item_discount_rupees'], saleitem['item_discount_prsntge'], idsale, saleitem['product_idproduct'],], function (error, result, fields) {

                                        if (error) throw error;
                                        else {

                                            //  console.log(result);

                                        }


                                    });

                                    stepinside(k + 1);



                                }

                                else {


                                }

                            }






                        }
                    });














                    step(j + 1);






                }
                else {

                    return res.send({ error: false, data: '', message: 'success' });
                    // console.log(content);



                }



            }












        
        
        } catch (error) {
            return false;
        }}







    });
});


function isValidToken(token) {
    try {
        const tokenDecodedData = jsonWebToken.verify(token, myJWTSecretKey);
        return true;
    } catch (error) {
        return false;
    }
}




// GET - http://localhost:3000/verify/{token}
app.get('/verify/:token', (req, res) => {
    try {
        const tokenDecodedData = jsonWebToken.verify(req.params.token, myJWTSecretKey);
        return res.json({
            error: false,
            data: tokenDecodedData
        });
    } catch (error) {
        res.json({
            error: true,
            data: error
        });
    }
})


app.get('*', function(req, res){
    res.status(404).send('what???');
  });


app.listen(port, function () {
    console.log("Express server running on port %d", port);
});
