let product = {
  barcode_one: '',
  barcode_two: '',
  type: 'unsupported',
  goods_code: '',
  udi_code: '',
  lot_code: '',
  manu_code: '',
  manu_date: '',
  expiry_date: '',
};

let doubleBarcode = false;

const CODE_TYPE = {
  GOODS_CODE: 1,
  UDI_CODE: 2,
  LOT_CODE: 3,
  MANU_DATE: 4,
  EXP_DATE: 5
}

const DATE_FORMAT = {
  MMYY: 1,        // MMYY
  MMDDYY: 2,      // MMDDYY
  YYMMDD: 3,      // YYMMDD
  YYMMDDHH: 4,    // YYMMDDHH
  YYJJJ: 5,       // YYJJJ
  YYJJJHH: 6,     // YYJJJHH
};

const getDateString = (value, type) => {
  if (type == DATE_FORMAT.MMYY) {
      return '20' + value.substr(2, 2) + value.substr(0, 2) + '01';
  } else if (type == DATE_FORMAT.MMDDYY) {
      return '20' + value.substr(4, 2) + value.substr(0, 4);
  } else if (type == DATE_FORMAT.YYMMDD) {
      return '20' + value;
  } else if (type == DATE_FORMAT.YYMMDDHH) {
      return '20' + value.substr(0, 6);
  } else if (type == DATE_FORMAT.YYJJJ || type == DATE_FORMAT.YYJJJHH) {
      //return '20' + value.substr(0, 2) + '0101';
      let year = 2000 + parseInt(value.substr(0, 2));
      let day = parseInt(value.substr(2, 3));
      if (day > 0 && day < 366) {
        let is_leapyear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        let rules = [31, is_leapyear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        for (var month = 0 ; month < rules.length ; month++) {
          if (rules[month] >= day) {
            return year + ("00" + (month+1)).slice(-2) + ("00" + day).slice(-2);
          }
          day -= rules[month];
        }
      }
  }
  return value;
};

const parseHibc = () => {
  product.type = 'hibc';

  let primaryCode = '';
  let secondaryCode = '';
  let confirmCheckDigit = true;

  if (doubleBarcode) {
    primaryCode = product.barcode_one.slice(1);
    secondaryCode = product.barcode_two;
    if (secondaryCode.charAt(0) == '+') {
      secondaryCode = secondaryCode.slice(1);
    }
  }

  if (!doubleBarcode) {
    let barcodeOneString = product.barcode_one.slice(1);
    let barcodeArray = barcodeOneString.split('/');
    primaryCode = barcodeArray.shift();

    if (barcodeArray.length == 0) {
      confirmCheckDigit = false;
    } else {
      secondaryCode = barcodeArray.join('/');
    }
  }

  // Get the primary info
  let primaryArray = primaryCode.split('');
  if (primaryArray[0] != '$') {
    product.manu_code = primaryCode.slice(0, 4);
    // Remove Manufacturer Code
    primaryArray.splice(0, 4);

    // Check digit
    let checkDigit1 = null;
    if (doubleBarcode && confirmCheckDigit) {
      checkDigit1 = primaryArray.pop();
    }

    // Remove Unit of Use
    primaryArray.pop();

    // Catalog number - unknown length, so implode the rest of the array
    product.goods_code = primaryArray.join('');
  } else {
    secondaryCode = primaryCode;
  }

  // Get the secondary info
  if (secondaryCode != '') {
    var pos = 1;
    let code_len = secondaryCode.length;
    
    if (secondaryCode.substr(pos, 1) != '$') {
      // +$xxxxxxLC
      // 产品代码
      let len = code_len - pos - 2;
      product.lot_code = secondaryCode.substr(pos, len);
      pos += len;
      return;
    } else {
      let hibc_rule = [
          ["2", 0, "", DATE_FORMAT.MMDDYY, 6, 0, 1, 1],     // +$$2xx2MMDDYYxxxxxLC
          ["3", 0, "", DATE_FORMAT.YYMMDD, 6, 0, 1, 1],     // +$$3xx2YYMMDDxxxxxLC
          ["4", 0, "", DATE_FORMAT.YYMMDDHH, 8, 0, 1, 1],   // +$$4xx2YYMMDDHHxxxxxLC
          ["5", 0, "", DATE_FORMAT.YYJJJ, 5, 0, 1, 1],      // +$$5xx2YYJJJxxxxxLC
          ["6", 0, "", DATE_FORMAT.YYJJJHH, 7, 0, 1, 1],    // +$$6xx2YYJJJHHxxxxxLC
          ["7", 0, "", 0, 0, 0, 1, 1],                      // +$$7xxxxxLC
          ["8", 2, "", DATE_FORMAT.MMYY, 4, 0, 1, 1],       // +$$8xxMMYYxxxxxLC
          ["8", 2, "2", DATE_FORMAT.MMDDYY, 6, 0, 1, 1],    // +$$8xx2MMDDYYxxxxxLC
          ["8", 2, "3", DATE_FORMAT.YYMMDD, 6, 0, 1, 1],    // +$$8xx3YYMMDDxxxxxLC
          ["8", 2, "4", DATE_FORMAT.YYMMDDHH, 8, 0, 1, 1],  // +$$8xx4YYMMDDHHxxxxxLC
          ["8", 2, "5", DATE_FORMAT.YYJJJ, 5, 0, 1, 1],     // +$$8xx5YYJJJxxxxxLC
          ["8", 2, "6", DATE_FORMAT.YYJJJHH, 7, 0, 1, 1],   // +$$8xx6YYJJJHHxxxxxLC
          ["8", 2, "7", 0, 0, 0, 1, 1],                     // +$$8xx7xxxxxLC
          ["9", 5, "", DATE_FORMAT.MMYY, 4, 0, 1, 1],       // +$$9xxxxxMMYYxxxxxLC
          ["9", 5, "2", DATE_FORMAT.MMDDYY, 6, 0, 1, 1],    // +$$9xxxxx2MMDDYYxxxxxLC
          ["9", 5, "3", DATE_FORMAT.YYMMDD, 6, 0, 1, 1],    // +$$9xxxxx3YYMMDDxxxxxLC
          ["9", 5, "4", DATE_FORMAT.YYMMDDHH, 8, 0, 1, 1],  // +$$9xxxxx4YYMMDDHHxxxxxLC
          ["9", 5, "5", DATE_FORMAT.YYJJJ, 5, 0, 1, 1],     // +$$9xxxxx5YYJJJxxxxxLC
          ["9", 5, "6", DATE_FORMAT.YYJJJHH, 7, 0, 1, 1],   // +$$9xxxxx6YYJJJHHxxxxxLC
          ["9", 5, "7", 0, 0, 0, 1, 1],                     // +$$8xx7xxxxxLC
      ];
      var len = 0;
      pos++; // 跳过第二个$
      for (let rule of hibc_rule) {
        var curpos = pos;
        var curstr = secondaryCode.substr(curpos, 1);
        if (curstr == rule[0]) {
          curpos += 1 + rule[1];
          if (rule[2] == "") {
            if (parseInt(secondaryCode.substr(curpos, 1)) < 2) {
              // 过期日期
              product.expire_date = getDateString(secondaryCode.substr(curpos, rule[4]), rule[3]);
              curpos += rule[4];
              // 产品代码
              len = code_len - curpos - 2;
              product.lot_code = secondaryCode.substr(curpos, len);
              curpos += len;
              return;
            }
          } else {
            if (secondaryCode.substr(curpos, 1) == rule[2]) {
              curpos++;
              // 过期日期
              product.expiry_date = getDateString(secondaryCode.substr(curpos, rule[4]), rule[3]);
              curpos += rule[4];
              // 产品代码
              len = code_len - curpos - 2;
              product.lot_code = secondaryCode.substr(curpos, len);
              return;
            }
          }
        }
      }
      // 最后一种情况：+$$MMYYxxxxxxLC
      product.expire_date = getDateString(secondaryCode.substr(pos, 4), DATE_FORMAT.MMYY);
      pos += 4;
      // 产品代码
      len = code_len - pos - 2;
      product.lot_code = secondaryCode.substr(pos, len);
      return;
    }
  }
};




const parseGs1 = () => {
  product.type = 'gs1';

  var invalidCode = true;
  let ucc_rule = [
      ["00", 18, CODE_TYPE.GOODS_CODE], // 包装代码
      ["01", 14, CODE_TYPE.UDI_CODE],   // 包装代码UDI
      ["02", 14, CODE_TYPE.GOODS_CODE], // 包装代码
      ["10", 0, CODE_TYPE.LOT_CODE],    // 追溯商品批号
      ["11", 6, CODE_TYPE.MANU_DATE],   // 生产日期 yymmdd
      ["13", 6, CODE_TYPE.MANU_DATE],   // 包装日期 yymmdd
      ["15", 6, CODE_TYPE.EXP_DATE],    // 最短保存期限 yymmdd
      ["17", 6, CODE_TYPE.EXP_DATE],    // 最长保存期限 yymmdd
      ["21", 0, CODE_TYPE.LOT_CODE],    // 追溯商品序号
//            ["30", 0],  // 内装商品数量
//            ["37", 0],  // 内装商品最大数量
//            ["240", 0],  // 制造商附加识别号
//            ["241", 0],  // 客户编号
//            ["250", 0],  // 第二序号
//            ["251", 0,  // 来源序号
  ];

  var pos = 0;
  while (pos < product.barcode_one.length) {
      var prechar = product.barcode_one.substr(pos, 2);

      for (let rule of ucc_rule) {
        if (prechar == rule[0]) {
            if (rule[2] == CODE_TYPE.GOODS_CODE) {
                product.goods_code = product.barcode_one.substr(pos+2, rule[1]);
                pos += 2 + rule[1];
            } else if (rule[2] == CODE_TYPE.UDI_CODE) {
                product.udi_code = product.barcode_one.substr(pos+2, rule[1]);
                pos += 2 + rule[1];
                if (product.goods_code == '') {
                  product.goods_code = product.udi_code;
                }
            } else if (rule[2] == CODE_TYPE.LOT_CODE) {
                var lot_code = product.barcode_one.substr(pos+2);
                pos += 2 + lot_code.length;
                if (lot_code.length > 8) {
                    // 康定特殊处理
                    if (lot_code.substr(8, 2) == "21") {
                        // 拼接序号
                        lot_code = lot_code.substr(0, 8) + lot_code.substr(10);
                    }
                }
                product.lot_code = lot_code;
            } else if (rule[2] == CODE_TYPE.MANU_DATE) {
                // 生产日期
                product.manu_date = product.barcode_one.substr(pos+2, rule[1]);
                pos += 2 + rule[1];
            } else if (rule[2] == CODE_TYPE.EXP_DATE) {
                // 有效日期
                product.expiry_date = product.barcode_one.substr(pos+2, rule[1]);
                pos += 2 + rule[1];
            }
        }
      }
  }
};

// const parseSimple = () => {
//   product.type = 'simple';
//   product.goods_code = product.barcode_one;
//   product.lot_code = product.barcode_two;
// };

export default function parse(barcodeOne, barcodeTwo) {
  product.barcode_one = barcodeOne;
  if (barcodeTwo !== undefined) {
    doubleBarcode = true;
    product.barcode_two = barcodeTwo;
  }

  // Remove * from beginning and end
  if (barcodeOne.charAt(0) == '*') {
    barcodeOne = barcodeOne.slice(0, -1);
    barcodeOne = barcodeOne.slice(1);
  }
  if (barcodeOne.charAt(0) == '+') {
    parseHibc();
  } else {
    parseGs1();
  }

  return product;
}
