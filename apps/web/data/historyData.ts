export interface EpochLog {
  epoch: number;
  rnnAcc: number | null;
  rnnLoss: number | null;
  rnnValAcc: number | null;
  rnnValLoss: number | null;
  lstmAcc: number | null;
  lstmLoss: number | null;
  lstmValAcc: number | null;
  lstmValLoss: number | null;
  stackedAcc: number | null;
  stackedLoss: number | null;
  stackedValAcc: number | null;
  stackedValLoss: number | null;
}

export const AUTHENTIC_EPOCH_DATA: EpochLog[] = [
  {
    epoch: 1,
    rnnAcc: 0.0369, rnnLoss: 6.8916, rnnValAcc: 0.0454, rnnValLoss: 6.8788,
    lstmAcc: 0.0415, lstmLoss: 6.7084, lstmValAcc: 0.0490, lstmValLoss: 6.6079,
    stackedAcc: 0.0358, stackedLoss: 6.8120, stackedValAcc: 0.0365, stackedValLoss: 6.6722
  },
  {
    epoch: 2,
    rnnAcc: 0.0615, rnnLoss: 6.4838, rnnValAcc: 0.0754, rnnValLoss: 6.9735,
    lstmAcc: 0.0614, lstmLoss: 6.2908, lstmValAcc: 0.0686, lstmValLoss: 6.4500,
    stackedAcc: 0.0504, stackedLoss: 6.4223, stackedValAcc: 0.0531, stackedValLoss: 6.6120
  },
  {
    epoch: 3,
    rnnAcc: 0.0860, rnnLoss: 6.1790, rnnValAcc: 0.0881, rnnValLoss: 6.6140,
    lstmAcc: 0.0862, lstmLoss: 5.9944, lstmValAcc: 0.0951, lstmValLoss: 6.3585,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 4,
    rnnAcc: 0.0999, rnnLoss: 6.0112, rnnValAcc: 0.0913, rnnValLoss: 6.5477,
    lstmAcc: 0.1059, lstmLoss: 5.7229, lstmValAcc: 0.1015, lstmValLoss: 6.3166,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 5,
    rnnAcc: 0.1109, rnnLoss: 5.7743, rnnValAcc: 0.0958, rnnValLoss: 6.4778,
    lstmAcc: 0.1185, lstmLoss: 5.4781, lstmValAcc: 0.1091, lstmValLoss: 6.3418,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 6,
    rnnAcc: 0.1230, rnnLoss: 5.5635, rnnValAcc: 0.1008, rnnValLoss: 6.4765,
    lstmAcc: 0.1262, lstmLoss: 5.2497, lstmValAcc: 0.1092, lstmValLoss: 6.3894,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 7,
    rnnAcc: 0.1334, rnnLoss: 5.3697, rnnValAcc: 0.1109, rnnValLoss: 6.5041,
    lstmAcc: 0.1383, lstmLoss: 5.0287, lstmValAcc: 0.1106, lstmValLoss: 6.4528,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 8,
    rnnAcc: 0.1428, rnnLoss: 5.1778, rnnValAcc: 0.1119, rnnValLoss: 6.5270,
    lstmAcc: 0.1471, lstmLoss: 4.8125, lstmValAcc: 0.1109, lstmValLoss: 6.5104,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 9,
    rnnAcc: 0.1498, rnnLoss: 5.0300, rnnValAcc: 0.1136, rnnValLoss: 6.5788,
    lstmAcc: 0.1593, lstmLoss: 4.5989, lstmValAcc: 0.1122, lstmValLoss: 6.5906,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 10,
    rnnAcc: null, rnnLoss: null, rnnValAcc: null, rnnValLoss: null,
    lstmAcc: 0.1763, lstmLoss: 4.3930, lstmValAcc: 0.1133, lstmValLoss: 6.6531,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 11,
    rnnAcc: null, rnnLoss: null, rnnValAcc: null, rnnValLoss: null,
    lstmAcc: 0.1956, lstmLoss: 4.1925, lstmValAcc: 0.1125, lstmValLoss: 6.7459,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 12,
    rnnAcc: null, rnnLoss: null, rnnValAcc: null, rnnValLoss: null,
    lstmAcc: 0.2191, lstmLoss: 4.0020, lstmValAcc: 0.1120, lstmValLoss: 6.8222,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 13,
    rnnAcc: null, rnnLoss: null, rnnValAcc: null, rnnValLoss: null,
    lstmAcc: 0.2428, lstmLoss: 3.8210, lstmValAcc: 0.1107, lstmValLoss: 6.8934,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  },
  {
    epoch: 14,
    rnnAcc: null, rnnLoss: null, rnnValAcc: null, rnnValLoss: null,
    lstmAcc: 0.2645, lstmLoss: 3.6613, lstmValAcc: 0.1101, lstmValLoss: 6.9834,
    stackedAcc: null, stackedLoss: null, stackedValAcc: null, stackedValLoss: null
  }
];
