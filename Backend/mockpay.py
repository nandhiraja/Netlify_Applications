import http.client

conn = http.client.HTTPSConnection("mercury-uat.phonepe.com")

payload = ""


order_id = "ord-6d1d626017694a1d91ef0e643676c668"


headers = {
    'X-PROVIDER-ID': "HIMALAYANSAVOURPROVIDER",
    'X-VERIFY': "f80d3f34-b2f2-4bf0-8d98-15dc2d58271d###1"
    }

conn.request("POST", "/enterprise-sandbox/edc/pay/merchant/HIMALAYANSAVOURUAT/transaction/"+order_id+"/paymentOption/CREDIT_CARD", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))