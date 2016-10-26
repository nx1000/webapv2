var express = require("express");
var myParser = require("body-parser");
var app = express();
var moment = require("moment");

var dbconn = {
    host: 'localhost',
    user: 'root',
    password: 'p3nd3kar',
    database: 'hrc',
};

app.use(myParser.json());
app.use(myParser.urlencoded({ extended: true }));

var allowCrossDomain = function(req, res, next) {
    if ('OPTIONS' == req.method) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        res.send(200);
    } else {
        next();
    }
};

app.use(allowCrossDomain);

app.use("/", express.static(__dirname));

app.get('/approval/:id', function(req, res) {
    refreshHeader(req.params, function(x) {
        res.header('Access-Control-Allow-Origin', '*');
        res.send(x);
    });
});

app.get('/login/:user/:pass', function(req, res) {
    console.log(req.params);
    validateUser(req.params, function(hasilnya) {
        res.header('Access-Control-Allow-Origin', '*');
        res.send(hasilnya);
        console.log('Login user: ' + hasilnya);
    });
});


app.post('/approve', function(req, res) {
    console.log('approving ' + req.body.trno);
    doApprove(req.body, function(hasilnya) {
        res.header('Access-Control-Allow-Origin', '*');
        res.send(hasilnya);
    });
});

app.post('/reject', function(req, res) {
    console.log('rejecting ' + req.body.trno);
    doReject(req.body, function(hasilnya) {
        console.log('hasilnya post reject: ' + hasilnya)
        res.header('Access-Control-Allow-Origin', '*');
        res.send(hasilnya);
    });

});

app.post('/return', function(req, res) {
    console.log('returning ' + req.body);
    doReturn(req.body, function(hasilnya) {
        console.log('hasilnya post return ' + hasilnya);
        res.header('Access-Control-Allow-Origin', '*');
        res.send(hasilnya);
    });

});

app.post('/status', function(req, res) {
    showStatus(req.body, function(hasil) {
        res.header('Access-Control-Allow-Origin', '*');
        res.send(hasil);
    });
});

app.post('/detail', function(req, res) {
    console.log('getting details ');
    refreshDetail(req.body, function(detailnya) {
        console.log(detailnya);
        res.header('Access-Control-Allow-Origin', '*');
        res.send(detailnya);
    });
});


function refreshHeader(user, callback) { //getSQL menerima req.body ke dalam variable nama
    var mysql = require('mysql');
    var connection = mysql.createConnection(dbconn);

    console.log(user.id);

    connection.connect();

    var trtpcd = '';

    var json = '';

    var querystr = "SELECT a.trtpcd,a.trno,a.trdt,a.trdesc,a.deptfr,a.deptto,whto,ltramt,c.lvl,d.notes,cbcd,currcd,timeapv,a.note as prnote " +
        "FROM glftrhdpo a,lgsapv c,lgfapv d " +
        "WHERE (a.trtpcd=" + mysql.escape(trtpcd) + " or " + mysql.escape(trtpcd) + "='') and a.active=1 " +
        "AND ((deptfr=deptcd and a.trtpcd='7019') OR  (deptto=deptcd and a.trtpcd<>'7019')) " +
        "AND a.trtpcd=c.trtpcd and c.trtpcd=d.trtpcd and a.trno=d.trno " +
        "AND c.lvl=d.lvl and (userid=" + mysql.escape(user.id) + " OR (" + mysql.escape(user.id) + "<>'' and repluser=" + mysql.escape(user.id) + " and userid=" + mysql.escape(user.id) + ")) " +
        "AND apv=0 and can=0 and timesend<>'' " +
        "AND not exists (select userapv from lgfapv x where trtpcd=d.trtpcd and trno=a.trno and apv=0 and lvl<d.lvl) " +
        "UNION " +
        "SELECT a.trtpcd,a.trno,a.trdt,a.trdesc,a.deptfr,a.deptto,' ' as whto,amtreq as ltramt,c.lvl,d.notes,cbcd,currcd,timeapv,' ' as PRNote " +
        "FROM fofcahd a,lgsapv c,lgfapv d " +
        "WHERE (a.trtpcd=" + mysql.escape(trtpcd) + " or  " + mysql.escape(trtpcd) + "='') and a.active=1  and timesend<>''  and a.trtpcd=c.trtpcd and c.trtpcd=d.trtpcd and a.trno=d.trno and c.lvl=d.lvl " +
        "AND (userid=" + mysql.escape(user.id) + " or (" + mysql.escape(trtpcd) + "<>'' and repluser= " + mysql.escape(trtpcd) + " and userid=" + mysql.escape(trtpcd) + ")) and apv=0 and can=0 and a.deptfr=c.deptcd " +
        "AND not exists (select userapv from lgfapv x where trtpcd=d.trtpcd and trno=a.trno  and apv=0 and lvl<d.lvl) ";

    // var querystr = "SELECT * FROM gnsystem";


    connection.query(querystr, function(err, result, fields) { // dan meng-eksekusi

        // console.log(result[0].foprd);
        console.log(result.length);
        json = JSON.stringify(result); // mengkonversi menjadi json
        callback(json); // dan mengembalikan ke pemanggilnya
        connection.end();
    });

}

function validateUser(login, callback) { //getSQL menerima req.body ke dalam variable nama
    var mysql = require('mysql');
    var connection = mysql.createConnection(dbconn);

    var querystr = "SELECT UserCd from gnuser where UserCd=" + mysql.escape(login.user) + " and NewPswrd=" + mysql.escape(login.pass);
    console.log(querystr);

    connection.query(querystr, function(err, result, fields) {

        callback(JSON.stringify(result));
        connection.end();
    });

}

function doApprove(glftrhdpo, callback) { //getSQL menerima req.body ke dalam variable nama
    var mysql = require('mysql');
    var connection = mysql.createConnection(dbconn);

    console.log('108 ' + glftrhdpo);

    var wkt = new Date();
    var jam = wkt.getHours();
    if (jam < 10) {
        jam = "0" + jam;
    }
    var menit = wkt.getMinutes();
    if (menit < 10) {
        menit = "0" + menit;
    }
    var wktapv = jam + ":" + menit;

    var querystr = "update lgfapv set apv=1,can=0,ret=0,notes=" + mysql.escape(glftrhdpo.notes) + ",userapv=" + mysql.escape(glftrhdpo.userid) + ",dateapv=now()," +
        "timeapv=" + mysql.escape(wktapv) +
        " where trtpcd=" + mysql.escape(glftrhdpo.trtpcd) + " and trno=" + mysql.escape(glftrhdpo.trno) + " and lvl=" + glftrhdpo.lvl;
    console.log(querystr);

    connection.query(querystr, function(err, result, fields) {

        callback(JSON.stringify(result));
        connection.end();
    });

}

function doReject(trx, callback) {
    var mysql = require('mysql');
    var connection = mysql.createConnection(dbconn);

    console.log('151 ' + trx);

    var wkt = new Date();
    var jam = wkt.getHours();
    if (jam < 10) {
        jam = "0" + jam;
    }
    var menit = wkt.getMinutes();
    if (menit < 10) {
        menit = "0" + menit;
    }
    var wktreject = jam + ":" + menit;

    var querystr = "update lgfapv set can=1,notes=" + mysql.escape(trx.notes) +
        ",userapv=" + mysql.escape(trx.userid) + ",dateapv=now(),timeapv=" + mysql.escape(wktreject) +
        " where trtpcd=" + mysql.escape(trx.trtpcd) + " and trno=" + mysql.escape(trx.trno) + " and lvl=" + trx.lvl;

    console.log(querystr);

    connection.query(querystr, function(err, result, fields) {
        if (result.affectedRows == 1) {
            callback('reject_ok');
        }
        connection.end();
    });

}

function doReturn(trx, callback) {
    var mysql = require('mysql');
    var connection = mysql.createConnection(dbconn);

    console.log('195 ' + trx);

    var affectedRows1 = 0;
    var affectedRows2 = 0;

    var wkt = new Date();
    var jam = wkt.getHours();
    if (jam < 10) {
        jam = "0" + jam;
    }
    var menit = wkt.getMinutes();
    if (menit < 10) {
        menit = "0" + menit;
    }
    var wktreturn = jam + ":" + menit;

    var prevLvl = trx.lvl - 1;

    if (prevLvl > 0 || trx.trtpcd == '7070') {
        var querystr1 = "update lgfapv set apv=0,ret=0,notes=" + mysql.escape('') +
            ",dateapv=null,timeapv=''" +
            " where trtpcd=" + mysql.escape(trx.trtpcd) + " and trno=" + mysql.escape(trx.trno) +
            " and lvl=" + prevLvl;

        console.log(querystr1);
        connection.query(querystr1, function(err, result, fields) {
            console.log(result);
            affectedRows1 = result.affectedRows;
            console.log('Affected Rows: ' + affectedRows1);
        });


        var querystr2 = "update lgfapv set apv=0,ret=1,notes=" + mysql.escape(trx.notes) + ",dateapv=now(),timeapv=" + mysql.escape(wktreturn) +
            " where trtpcd=" + mysql.escape(trx.trtpcd) + " and trno=" + mysql.escape(trx.trno) +
            " and lvl=" + trx.lvl;

        console.log(querystr2);

        connection.query(querystr2, function(err, result, fields) {
            console.log(result);
            affectedRows2 = result.affectedRows;
            console.log('Affected Rows: ' + affectedRows2);

            if (affectedRows1 == 1 && affectedRows2 == 1) {
                console.log('return ok');
                callback('ok');
            }
        });



    }

    connection.end();
}


function showStatus(trx, callback) {
    var mysql = require('mysql');
    var connection = mysql.createConnection(dbconn);

    var querystr = "select a.lvl,timeapv,(case when userApv<>'' then userApv else userId end) as userId," +
        " concat((case when a.apv=0 then ' ' else 'APPROVED' end ), (case when a.can=0 then ' ' else 'REJECTED' end ),(case when a.ret=0 then ' ' else 'RETURNED' end )) as apvstatus," +
        " a.notes,a.dateapv from lgfapv a,lgsapv b" +
        " where a.trtpcd=b.trtpcd and a.lvl=b.lvl and trno=" + mysql.escape(trx.trno) +
        " and a.trtpcd=" + mysql.escape(trx.trtpcd) +
        " and deptcd=" + mysql.escape(trx.deptcd);

    console.log(querystr);

    connection.query(querystr, function(err, result, fields) {
        callback(JSON.stringify(result));
        connection.end();
    });

}

function refreshDetail(trx, callback) {
    var mysql = require('mysql');
    var connection = mysql.createConnection(dbconn);

    var querystr = "select a.trdt,a.trno,a.prodcd,a.trdesc,a.supcd,a.deptto,a.qty,a.unit,a.unitamt,a.totalprice,a.taxpct,a.taxamt,a.discpct,a.discamt,a.notes,a.seq,a.supcd2,a.unitamt2,a.supcd3,a.unitamt3,a.canfl,ifnull(x.supdesc,' ') as supdesc," +
        " ifnull(y.supdesc,' ') as supdesc2,ifnull(z.supdesc,' ') as supdesc3,a.qtybeg,b.proddesc,id,coadtdesc as coadesc,qtyend as qtyohd,whto,a.SelectedSupp " +
        " from gncoadt coa,glftrdtpo a left join apssup x on (a.supcd=x.supcd) " +
        " left join apssup y on (a.supcd2=y.supcd) left join apssup z on (a.supcd3=z.supcd),lgsprod b where trtpcd=" + mysql.escape(trx.trtpcd) + " and a.prodcd=b.prodcd and a.active=1 and trno=" + mysql.escape(trx.trno) + " and trcoa=coadtcd " +
        " union " +
        " select a.trdt,a.trno,' ' as prodcd,a.trdesc,' ' as supcd,' ' as deptto,a.amtreq as qty,' ' as unit,0 as unitamt,a.amtreq as totalprice,0 as taxpct,0 as taxamt,0 as discpct,0 as discamt,a.notes,a.seq,' ' as supcd2, " +
        " 0 as unitamt2,' ' as supcd3,0 as unitamt3,a.canfl,' ' as supdesc,' ' as supdesc2,' ' as supdesc3,amtbeg as qtybeg,' ' as proddesc,id,coadtdesc as coadesc,0 as qtyohd,' ' as whto, a.SelectedSupp from fofcadt a,fofcahd b,gncoadt coa " +
        " where a.trtpcd=" + mysql.escape(trx.trtpcd) + " and a.active=1 and b.active=1 and a.trno=" + mysql.escape(trx.trno) +
        " and a.trtpcd=b.trtpcd and a.trno=b.trno and trcoa=coadtcd";

    console.log(querystr);

    connection.query(querystr, function(err, result, fields) {
        callback(JSON.stringify(result));
        connection.end();

    });

}


app.listen(8085);
console.log('server is running on port 8085');
