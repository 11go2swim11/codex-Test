
export interface HistoryData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export function calculateMA(data: HistoryData[], period: number) {
  return data.map((_, index) => {
    if (index < period - 1) return null;
    const slice = data.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    return sum / period;
  });
}

export function calculateRSI(data: HistoryData[], period: number = 14) {
  const rsi = new Array(data.length).fill(null);
  if (period <= 0 || data.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0 && avgGain === 0) {
    rsi[period] = 50;
  } else if (avgLoss === 0) {
    rsi[period] = 100;
  } else {
    rsi[period] = 100 - 100 / (1 + avgGain / avgLoss);
  }

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0 && avgGain === 0) {
      rsi[i] = 50;
    } else if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      rsi[i] = 100 - 100 / (1 + avgGain / avgLoss);
    }
  }

  return rsi;
}

export function calculateMACD(data: HistoryData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
  const calculateEMA = (data: number[], period: number) => {
    const ema = new Array(data.length).fill(null);
    if (period <= 0 || data.length < period) return ema;

    const k = 2 / (period + 1);
    let initialSum = 0;
    for (let i = 0; i < period; i++) initialSum += data[i];
    ema[period - 1] = initialSum / period;

    for (let i = period; i < data.length; i++) {
      ema[i] = data[i] * k + ema[i - 1] * (1 - k);
    }
    return ema;
  };

  const closes = data.map(d => d.close);
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine = fastEMA.map((f, i) => (f !== null && slowEMA[i] !== null ? f - slowEMA[i] : null));
  
  // Signal line is EMA of MACD line
  const validMacdLine = macdLine.filter(v => v !== null) as number[];
  const signalLinePart = validMacdLine.length >= signalPeriod
    ? calculateEMA(validMacdLine, signalPeriod)
    : new Array(validMacdLine.length).fill(null);
  
  const signalLine = new Array(data.length).fill(null);
  let signalIdx = 0;
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] !== null) {
      signalLine[i] = signalLinePart[signalIdx++];
    }
  }

  const histogram = macdLine.map((m, i) => (m !== null && signalLine[i] !== null ? m - signalLine[i] : null));

  return { macdLine, signalLine, histogram };
}
