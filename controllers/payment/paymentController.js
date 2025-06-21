const paystackModel = require('../../models/paystackModel')
const sellerModel = require('../../models/sellerModel')

const sellerWalletModel = require('../../models/sellerWallet')
const withdrawalRequestModel = require('../../models/withdrawalRequest')

const axios = require('axios');
const { responseRouter } = require('../../utilities/response');
require('dotenv').config();

class paymentController {
    

    create_paystack_account = async(req,res) => {
        console.log("Calling create paystack account")
        const {id} = req;
        const business_name = 'ZOBIXY TEST';
        const bank_code = '51204';
        const account_number = '1234567890';  // Note: use string for account number
        const percentage_charge = 30

        try {
            const paystackInfo = await paystackModel.findOne({sellerId: id})

            if (paystackInfo) {
                //user exists on paystack and db
                await paystackModel.deleteOne({sellerId: id}) 
            }

            //todo insert code that creates a new paystack account
            // const response = await axios.post(
            //     "https://api.paystack.co/subaccount",
            //     {
            //         business_name,
            //         bank_code,
            //         account_number,
            //         percentage_charge,
            //         description: "Auto-generated subaccount"
            //     },
            //     {
            //         headers: {
            //             Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            //             "Content-Type": "application/json"
            //         }
            //     }
            // );

            // const account = response.data?.data;
            const accountLink = await paystackModel.create({
                sellerId: id,
                subaccount_code: '21214554',
                business_name: 'ZOBIXY ONLINE',
                account_number: 1234567890,
                bank_name: 'FNB',
                refresh_url: 'http://localhost:3001/refresh',
                return_url: `http://localhost:3001/success?activeCode=21214554`

            })
            
            responseRouter(res,201, {url: "http://localhost:3001/success?activeCode=21214554"})

        } catch (error) {
            console.error("Paystack error:", error.response?.data || error.message);
            return res.status(500).json({
                success: false,
                message: "Error creating Paystack account",
                error: error.response?.data || error.message
              });
        }
    }
    //END METHOD


    activate_payment_account = async(req,res) => {
        console.log("Calling activate payment account")
        const {activeCode} = req.params
        const {id} = req
        try {
            const userPayStackInfo = await paystackModel.findOne({ subaccount_code: activeCode})
            if (userPayStackInfo) {
                await sellerModel.findByIdAndUpdate(id,{
                    payment: 'active'
                })
                responseRouter(res,200, {message: "Payment Gateway Successfuly Activated"})
            } else {
                responseRouter(res,404, {message: "Payment activation failed"})
            }
        } catch (error) {
            responseRouter(res,500, {message: "Internal server error",error: error.response?.data || error.message})
        }
    }
   //END METHOD

   sumAmount = (data) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum = sum + data[i].amount;
        
    }
    return sum
   }

   get_seller_payment_details = async(req,res) => {
        console.log("Calling get seller payment details")
        const {sellerId} = req.params
        
        try {
            const payments = await sellerWalletModel.find({sellerId})

            const pendingWithdrawals = await withdrawalRequestModel.find({
                $and: [
                    {
                        sellerId: {
                            $eq: sellerId
                        }
                    },
                    {
                        status: {
                            $eq: 'pending'
                        }
                    }
                ]
            })


            const successfulWithdrawals = await withdrawalRequestModel.find({
                $and: [
                    {
                        sellerId: {
                            $eq: sellerId
                        }
                    },
                    {
                        status: {
                            $eq: 'success'
                        }
                    }
                ]
            })

            const pendingAmount = this.sumAmount(pendingWithdrawals)
            const withdrawalAmount = this.sumAmount(successfulWithdrawals)
            const totalAmount = this.sumAmount(payments)

            let availableAmount = 0;

            if (totalAmount > 0) {
                availableAmount = totalAmount - (pendingAmount + withdrawalAmount)     
            }

            responseRouter(res, 200, {
                totalAmount,
                pendingAmount,
                withdrawalAmount,
                availableAmount,
                pendingWithdrawals,
                successfulWithdrawals
            })


        } catch (error) {
            responseRouter(res,500, {message: "Internal server error",error: error.response?.data || error.message})
        }
    }
   //END METHOD



    withdrawal_request = async(req,res) => {
        console.log("Calling withdrawal request")
        const {amount, sellerId} = req.body
        
        try {
            const withdrawal = await withdrawalRequestModel.create({
                sellerId,
                amount: parseInt(amount)
            })
            responseRouter(res,200,{withdrawal, message: 'Withdrawal Request Sent!!!'})

        } catch (error) {
            responseRouter(res,500, {message: "Internal server error",error: error.response?.data || error.message})
        }
    }
   //END METHOD




    get_payment_request = async(req,res) => {
        console.log("Calling get payment request")
        
        try {
            const withdrawalRequest = await withdrawalRequestModel.find({status: 'pending'})
            responseRouter(res,200,{withdrawalRequest})

        } catch (error) {
            responseRouter(res,500, {message: "Internal server error",error: error.response?.data || error.message})
        }
    }
   //END METHOD


   payment_request_confirm = async(req,res) => {
        console.log("Calling payment request confirm")
        const {paymentId} = req.body
        try {
            const payment = await withdrawalRequestModel.findById(paymentId)
            //todo process payment request ...

            //end.....

            await withdrawalRequestModel.findByIdAndUpdate(paymentId, {status: 'success'})
            responseRouter(res,200,{payment, message: 'Payment Request Confirmed !!!'})

        } catch (error) {
            responseRouter(res,500, {message: "Internal server error",error: error.response?.data || error.message})
        }
    }
   //END METHOD


   

}

module.exports = new paymentController()