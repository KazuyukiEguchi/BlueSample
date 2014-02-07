// Chrome Packaged Apps で Bluetoothデバイスに接続して、SPP通信するサンプルアプリ
// Programed by Kazuyuki Eguchi
// 動作確認した環境
// Chrome バージョン 34.0.1825.4 dev (Mac OSX 10.9.1)
// 接続した確認したデバイス ランニングエレクトロニクス製　PIC24FJ64GB004 小型マイコン基板 SBDBT
// http://runningele.web.fc2.com/

var select = null;

// Serial Port ProfileのUUID
var UUID = '00001101-0000-1000-8000-00805f9b34fb';

var socket = null;

// 接続のコールバック関数
function onConnected(sock)
{
    if (sock)
    {
        socket = sock;
        startReadingPort();
    }
    else
    {
        console.error("Failed to connect.");
    }
}

// 接続ボタンを押された時の処理
function openPort ()
{
	selectedPort = select.childNodes[select.selectedIndex].value;
	console.log("Port " + selectedPort + " is selected.");
    
    chrome.bluetooth.connect({"device": {"address": selectedPort }, "profile": {"uuid": UUID}}, function()
    {
        if (chrome.runtime.lastError)
        {
            console.log("Error on connection.", chrome.runtime.lastError.message);
            return;
        }
    });
}

// 切断ボタンを押された時の処理
function closePort ()
{
	chrome.bluetooth.disconnect({"socket": socket}, function ()
    {
		console.log("close socket");
        
        if (chrome.runtime.lastError)
        {
            console.log("Error on connection.", chrome.runtime.lastError.message);
        }
        
        socket = null;
	});
}

// 受信処理
var reading = false;

function startReadingPort ()
{
    reading = true;
    readPort();
}

function readPort()
{
    chrome.bluetooth.read({"socket": socket}, function (readbuffer)
    {
        if (readbuffer.byteLength > 0)
        {
            var datas = new DataView(readbuffer);
            
            for(var i = 0 ; i < readbuffer.byteLength ; i++)
            {
				// とりあえず、受信したものは16進表示する
                console.log(datas.getInt8(i).toString(16));
            }
        }
        
        if (reading)
        {
            readPort();
        }
    });
}

//書き込みボタンを押した際の処理
function writePort ()
{
    var data = getArrayBufferForString(document.getElementById('textWrite').value);
    
	chrome.bluetooth.write({"socket": socket,"data": data}, function (sendInfo)
    {
        document.getElementById('textWrite').value = '';
    });
}

// 文字列からArrayBufferに変換する処理
function getArrayBufferForString(str)
{
    var buff = new ArrayBuffer(str.length);
    var arr = new Uint8Array(buff);
    
    for (var i=0; i<str.length; i++)
    {
        arr[i] = str.charCodeAt(i);
    }
    return buff;
}

// 起動した時の初期化処理
function init ()
{
    console.log("init()");

    var deviceList = [];
    
    select = document.getElementById('ports');
    
    document.getElementById('open').addEventListener('click', openPort);
    document.getElementById('close').addEventListener('click', closePort);
    document.getElementById('write').addEventListener('click', writePort);

    chrome.bluetooth.onConnection.addListener(onConnected);
    
    // SPPプロファイルを追加する。これやらないと繋がらない。
	// manifest.jsonのパーミッションの書き方を注意すること。
    // "permissions" : [{ "bluetooth": [ { "uuid": "00001101-0000-1000-8000-00805f9b34fb" } ] }],

    chrome.bluetooth.addProfile({"uuid": UUID}, function()
    {
        if (chrome.runtime.lastError)
        {
            console.log("Error on connection.", chrome.runtime.lastError.message);
        }
    });
    
    chrome.bluetooth.getDevices(
        {
            deviceCallback: function(device)
            {
                deviceList.push(device);
            }
        }
        ,
        function ()
        {
            for (var i in deviceList)
            {
                var device = deviceList[i];
                select.appendChild(new Option(device.name, device.address));
            }
        }
    );
}

window.onload = init;
