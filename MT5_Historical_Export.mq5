//+------------------------------------------------------------------+
//|                                            Historical_Export.mq5 |
//|                                    Copyright 2025, TradeAid Team |
//|                                             https://tradingaid.app |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, TradeAid Team"
#property link      "https://tradingaid.app"
#property version   "1.00"
#property description "Export last 3 days of trade history to CSV for TradeAid import"
#property description "Run this script once to export historical data"

#property strict


//--- Input parameters
input int      Days_To_Export = 3;        // Number of days to export (from today)
input bool     Include_Open_Trades = true; // Include currently open trades

//+------------------------------------------------------------------+
//| Script program start function                                    |
//+------------------------------------------------------------------+
void OnStart()
{
   Print("Starting historical trade export for last ", Days_To_Export, " days");
   
   // Calculate date range
   datetime endTime = TimeCurrent();
   datetime startTime = endTime - (Days_To_Export * 24 * 60 * 60);
   
   // Export closed trades
   ExportClosedTrades(startTime, endTime);
   
   // Export open trades if requested
   if(Include_Open_Trades)
   {
      ExportOpenTrades();
   }
   
   Print("Historical export completed");
}

//+------------------------------------------------------------------+
//| Export closed trades to CSV                                      |
//+------------------------------------------------------------------+
void ExportClosedTrades(datetime startTime, datetime endTime)
{
   string filename = "TradeAid_Historical_" + TimeToString(TimeCurrent(), TIME_DATE) + ".csv";
   int file_handle = FileOpen(filename, FILE_WRITE|FILE_CSV|FILE_ANSI, ",");
   
   if(file_handle == INVALID_HANDLE)
   {
      Print("Error creating file: ", filename, " Error: ", GetLastError());
      return;
   }
   
   // Write CSV header
   FileWrite(file_handle, 
      "mt5Ticket", "symbol", "direction", "volume", "entryPrice", "exitPrice",
      "profit", "commission", "swap", "openTime", "closeTime",
      "accountBalance", "accountEquity", "accountMargin"
   );
   
   // Select history range
   if(!HistorySelect(startTime, endTime))
   {
      Print("HistorySelect failed, error: ", GetLastError());
      FileClose(file_handle);
      return;
   }
   
   int dealsTotal = HistoryDealsTotal();
   int exportedCount = 0;
   
   for(int i = 0; i < dealsTotal; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0)
      {
         datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         
         // Check if deal is within our time range and is a trade (not deposit/withdrawal)
         if(dealTime >= startTime && dealTime <= endTime && IsTradeDeal(ticket))
         {
            ExportDealToCSV(file_handle, ticket);
            exportedCount++;
         }
      }
   }
   
   FileClose(file_handle);
   Print("Exported ", exportedCount, " closed trades to ", filename);
}

//+------------------------------------------------------------------+
//| Export open trades to CSV                                        |
//+------------------------------------------------------------------+
void ExportOpenTrades()
{
   string filename = "TradeAid_OpenTrades_" + TimeToString(TimeCurrent(), TIME_DATE) + ".csv";
   int file_handle = FileOpen(filename, FILE_WRITE|FILE_CSV|FILE_ANSI, ",");
   
   if(file_handle == INVALID_HANDLE)
   {
      Print("Error creating file: ", filename, " Error: ", GetLastError());
      return;
   }
   
   // Write CSV header
   FileWrite(file_handle, 
      "mt5Ticket", "symbol", "direction", "volume", "entryPrice", "exitPrice",
      "profit", "commission", "swap", "openTime", "closeTime",
      "accountBalance", "accountEquity", "accountMargin"
   );
   
   int positionsTotal = PositionsTotal();
   int exportedCount = 0;
   
   for(int i = 0; i < positionsTotal; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket))
      {
         ExportPositionToCSV(file_handle, ticket);
         exportedCount++;
      }
   }
   
   FileClose(file_handle);
   Print("Exported ", exportedCount, " open trades to ", filename);
}

//+------------------------------------------------------------------+
//| Export individual deal to CSV                                    |
//+------------------------------------------------------------------+
void ExportDealToCSV(int file_handle, ulong ticket)
{
   string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
   long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
   string direction = (dealType == DEAL_TYPE_BUY) ? "BUY" : "SELL";
   double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
   double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
   double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
   datetime openTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
   
   // For closed trades, we use the same time for open and close
   datetime closeTime = openTime;
   
   // Get account info at the time of the deal (we use current values as approximation)
   double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double accountEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   double accountMargin = AccountInfoDouble(ACCOUNT_MARGIN);
   
   FileWrite(file_handle,
      IntegerToString(ticket),
      symbol,
      direction,
      DoubleToString(volume, 2),
      DoubleToString(price, 5),
      DoubleToString(price, 5), // exitPrice same as entry for simplicity
      DoubleToString(profit, 2),
      DoubleToString(commission, 2),
      DoubleToString(swap, 2),
      TimeToString(openTime, TIME_DATE|TIME_SECONDS),
      TimeToString(closeTime, TIME_DATE|TIME_SECONDS),
      DoubleToString(accountBalance, 2),
      DoubleToString(accountEquity, 2),
      DoubleToString(accountMargin, 2)
   );
}

//+------------------------------------------------------------------+
//| Export individual position to CSV                                |
//+------------------------------------------------------------------+
void ExportPositionToCSV(int file_handle, ulong ticket)
{
   if(!PositionSelectByTicket(ticket))
   {
      Print("PositionSelectByTicket failed for ticket ", ticket, " error: ", GetLastError());
      return;
   }
   string symbol = PositionGetString(POSITION_SYMBOL);
   long positionType = PositionGetInteger(POSITION_TYPE);
   string direction = (positionType == POSITION_TYPE_BUY) ? "BUY" : "SELL";
   double volume = PositionGetDouble(POSITION_VOLUME);
   double entryPrice = PositionGetDouble(POSITION_PRICE_OPEN);
   double profit = PositionGetDouble(POSITION_PROFIT);
   double swap = PositionGetDouble(POSITION_SWAP);
   datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
   
   // Estimate commission
   double commission = CalculateEstimatedCommission(symbol, volume, entryPrice);
   
   // Get current account info
   double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double accountEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   double accountMargin = AccountInfoDouble(ACCOUNT_MARGIN);
   
   FileWrite(file_handle,
      IntegerToString(ticket),
      symbol,
      direction,
      DoubleToString(volume, 2),
      DoubleToString(entryPrice, 5),
      "", // exitPrice empty for open trades
      DoubleToString(profit, 2),
      DoubleToString(commission, 2),
      DoubleToString(swap, 2),
      TimeToString(openTime, TIME_DATE|TIME_SECONDS),
      "", // closeTime empty for open trades
      DoubleToString(accountBalance, 2),
      DoubleToString(accountEquity, 2),
      DoubleToString(accountMargin, 2)
   );
}

//+------------------------------------------------------------------+
//| Check if deal is a trade (not deposit/withdrawal/etc)           |
//+------------------------------------------------------------------+
bool IsTradeDeal(ulong ticket)
{
   long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
   
   // Filter out non-trade deals (only check for BUY and SELL, remove MARKET types)
   return (dealType == DEAL_TYPE_BUY || 
           dealType == DEAL_TYPE_SELL);
}

//+------------------------------------------------------------------+
//| Calculate estimated commission                                   |
//+------------------------------------------------------------------+
double CalculateEstimatedCommission(string symbol, double volume, double price)
{
   // Simple commission estimation
   double commissionRate = 0.0002; // 0.02% commission rate
   double tradeValue = volume * price;
   return tradeValue * commissionRate;
}
//+------------------------------------------------------------------+
