//+------------------------------------------------------------------+
//|                                                  TradeAid_EA.mq5 |
//|                                    Copyright 2025, TradeAid Team |
//|                                             https://tradingaid.app |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, TradeAid Team"
#property link      "https://tradingaid.app"
#property version   "1.00"
#property description "TradeAid MT5 Expert Advisor - Sends trade data to TradeAid backend"
#property description "Captures trade open/close events, account details, and screenshots"

#property strict

//--- Input parameters
input string   API_URL = "https://tradingaid.onrender.com/api/trade-logs";  // TradeAid API endpoint
input string   API_KEY = "tradeaid_mt5_key_2025";                           // API key for authentication
input bool     Enable_Screenshots = true;                                    // Enable screenshot capture
input int      Screenshot_Width = 800;                                       // Screenshot width
input int      Screenshot_Height = 600;                                      // Screenshot height
input int      Retry_Attempts = 3;                                           // HTTP request retry attempts
input int      Retry_Delay = 1000;                                           // Retry delay in milliseconds

//--- Global variables
string         lastError = "";
datetime       lastTradeTime = 0;
bool           isFirstRun = true;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("TradeAid EA initialized");
   Print("API URL: ", API_URL);
   Print("Screenshot capture: ", Enable_Screenshots ? "Enabled" : "Disabled");
   
   // Validate inputs
   if(StringLen(API_KEY) == 0)
   {
      Alert("Warning: API_KEY is empty. Please set your TradeAid API key.");
   }
   
   if(StringLen(API_URL) == 0)
   {
      Alert("Error: API_URL is empty. Please set your TradeAid API endpoint.");
      return INIT_PARAMETERS_INCORRECT;
   }
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("TradeAid EA deinitialized. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check for new trades on first run and then monitor trade events
   if(isFirstRun)
   {
      isFirstRun = false;
      CheckExistingTrades();
   }
}

//+------------------------------------------------------------------+
//| Trade event handler                                              |
//+------------------------------------------------------------------+
void OnTrade()
{
   // Get current time to avoid duplicate processing
   datetime currentTime = TimeCurrent();
   if(currentTime <= lastTradeTime) return;
   
   lastTradeTime = currentTime;
   
   // Process trade events
   ProcessTradeEvents();
}

//+------------------------------------------------------------------+
//| Process trade events                                             |
//+------------------------------------------------------------------+
void ProcessTradeEvents()
{
   // Get current positions
   int positions = PositionsTotal();
   
   // Check for new trades or closed trades
   for(int i = positions - 1; i >= 0; i--)
   {
      if(PositionGetTicket(i))
      {
         ulong ticket = PositionGetInteger(POSITION_TICKET);
         datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
         
         // Check if this is a new trade (opened within last minute)
         if(openTime > TimeCurrent() - 60)
         {
            SendTradeData(ticket, "open");
         }
      }
   }
   
   // Check history for closed trades in the last minute
   datetime checkTime = TimeCurrent() - 60;
   int historyTotal = HistoryOrdersTotal();
   
   for(int i = historyTotal - 1; i >= 0; i--)
   {
      ulong ticket = HistoryOrderGetTicket(i);
      if(ticket > 0)
      {
         datetime closeTime = (datetime)HistoryOrderGetInteger(ticket, ORDER_TIME_DONE);
         
         if(closeTime > checkTime && closeTime > lastTradeTime - 60)
         {
            SendTradeData(ticket, "closed");
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Check existing trades on startup                                 |
//+------------------------------------------------------------------+
void CheckExistingTrades()
{
   int positions = PositionsTotal();
   Print("Checking ", positions, " existing positions");
   
   for(int i = 0; i < positions; i++)
   {
      if(PositionGetTicket(i))
      {
         ulong ticket = PositionGetInteger(POSITION_TICKET);
         SendTradeData(ticket, "open");
      }
   }
}

//+------------------------------------------------------------------+
//| Send trade data to API                                           |
//+------------------------------------------------------------------+
void SendTradeData(ulong ticket, string action)
{
   // Prepare trade data
   string tradeData = PrepareTradeData(ticket, action);
   
   if(StringLen(tradeData) == 0)
   {
      Print("Failed to prepare trade data for ticket ", ticket);
      return;
   }
   
   // Prepare headers
   string headers = "Content-Type: application/json\r\n";
   if(StringLen(API_KEY) > 0)
   {
      headers += "Authorization: Bearer " + API_KEY + "\r\n";
   }
   
   // Send HTTP POST request
   char data[];
   char result[];
   string resultStr;
   
   StringToCharArray(tradeData, data, 0, StringLen(tradeData));
   
   for(int attempt = 0; attempt < Retry_Attempts; attempt++)
   {
      int res = WebRequest("POST", API_URL, headers, 5000, data, result, resultStr);
      
      if(res == 200)
      {
         Print("Successfully sent trade data for ticket ", ticket, " (", action, ")");
         return;
      }
      else if(res == -1)
      {
         int error = GetLastError();
         Print("WebRequest failed, error: ", error, " (", ErrorDescription(error), ")");
      }
      else
      {
         Print("HTTP error: ", res, " - ", resultStr);
      }
      
      if(attempt < Retry_Attempts - 1)
      {
         Sleep(Retry_Delay);
      }
   }
   
   Print("Failed to send trade data for ticket ", ticket, " after ", Retry_Attempts, " attempts");
}

//+------------------------------------------------------------------+
//| Prepare trade data JSON                                          |
//+------------------------------------------------------------------+
string PrepareTradeData(ulong ticket, string action)
{
   string symbol = "";
   string direction = "";
   double volume = 0;
   double entryPrice = 0;
   double exitPrice = 0;
   double profit = 0;
   double commission = 0;
   double swap = 0;
   datetime openTime = 0;
   datetime closeTime = 0;
   
   // Get account information
   double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double accountEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   double accountMargin = AccountInfoDouble(ACCOUNT_MARGIN);
   
   if(action == "open")
   {
      // Get position data
      if(PositionSelectByTicket(ticket))
      {
         symbol = PositionGetString(POSITION_SYMBOL);
         direction = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? "BUY" : "SELL";
         volume = PositionGetDouble(POSITION_VOLUME);
         entryPrice = PositionGetDouble(POSITION_PRICE_OPEN);
         profit = PositionGetDouble(POSITION_PROFIT);
         swap = PositionGetDouble(POSITION_SWAP);
         openTime = (datetime)PositionGetInteger(POSITION_TIME);
         
         // Estimate commission (MT5 doesn't provide this directly)
         commission = CalculateEstimatedCommission(symbol, volume, entryPrice);
      }
   }
   else if(action == "closed")
   {
      // Get history deal data
      if(HistoryDealSelect(ticket))
      {
         symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
         direction = (HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_BUY) ? "BUY" : "SELL";
         volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
         entryPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
         profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
         commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
         swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
         openTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         closeTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      }
   }
   
   // Prepare screenshot if enabled
   string screenshotBase64 = "";
   if(Enable_Screenshots)
   {
      screenshotBase64 = CaptureScreenshot(symbol);
   }
   
   // Build JSON payload
   string json = "{";
   json += "\"mt5Ticket\":\"" + IntegerToString(ticket) + "\",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"direction\":\"" + direction + "\",";
   json += "\"volume\":" + DoubleToString(volume, 2) + ",";
   json += "\"entryPrice\":" + DoubleToString(entryPrice, 5) + ",";
   
   if(action == "closed")
   {
      json += "\"exitPrice\":" + DoubleToString(exitPrice, 5) + ",";
      json += "\"closeTime\":\"" + TimeToString(closeTime, TIME_DATE|TIME_SECONDS) + "\",";
   }
   
   json += "\"profit\":" + DoubleToString(profit, 2) + ",";
   json += "\"commission\":" + DoubleToString(commission, 2) + ",";
   json += "\"swap\":" + DoubleToString(swap, 2) + ",";
   json += "\"openTime\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\",";
   json += "\"accountBalance\":" + DoubleToString(accountBalance, 2) + ",";
   json += "\"accountEquity\":" + DoubleToString(accountEquity, 2) + ",";
   json += "\"accountMargin\":" + DoubleToString(accountMargin, 2);
   
   if(StringLen(screenshotBase64) > 0)
   {
      json += ",\"screenshot\":\"" + screenshotBase64 + "\"";
   }
   
   if(StringLen(API_KEY) > 0)
   {
      json += ",\"apiKey\":\"" + API_KEY + "\"";
   }
   
   json += "}";
   
   return json;
}

//+------------------------------------------------------------------+
//| Capture screenshot                                               |
//+------------------------------------------------------------------+
string CaptureScreenshot(string symbol)
{
   string filename = "TradeAid_" + symbol + "_" + IntegerToString(GetTickCount()) + ".png";
   string path = "\\Screenshots\\" + filename;
   
   if(ChartScreenShot(0, path, Screenshot_Width, Screenshot_Height, ALIGN_LEFT))
   {
      // In a real implementation, we would read the file and convert to base64
      // For now, we'll return a placeholder since file operations in MQL5 are limited
      Print("Screenshot captured: ", path);
      return "screenshot_placeholder_base64"; // Placeholder
   }
   
   return "";
}

//+------------------------------------------------------------------+
//| Calculate estimated commission                                   |
//+------------------------------------------------------------------+
double CalculateEstimatedCommission(string symbol, double volume, double price)
{
   // Simple commission estimation
   // This is a placeholder - adjust based on your broker's commission structure
   double commissionRate = 0.0002; // 0.02% commission rate
   double tradeValue = volume * price;
   return tradeValue * commissionRate;
}

//+------------------------------------------------------------------+
//| Error description                                                |
//+------------------------------------------------------------------+
string ErrorDescription(int error)
{
   switch(error)
   {
      case 0:     return "No error";
      case 4001:  return "Invalid URL";
      case 4002:  return "Cannot connect to server";
      case 4003:  return "Timeout";
      case 4004:  return "HTTP error";
      case 4005:  return "Invalid response";
      case 4006:  return "Out of memory";
      case 4010:  return "Not allowed";
      default:    return "Unknown error";
   }
}
//+------------------------------------------------------------------+
