
const TOKEN = 'hxH3oyyZDwt6H6yO0GS8S'; // 替换为你的 Token
const ENCODING_AES_KEY = 'IxiL6zRORMpkLb8buPetvBlovPt53MT6SpotVzl4yNS'; // 替换为你的 EncodingAESKey

async function verifySignature(token, timestamp, nonce, echostr, msgSignature) {
	// 将 token、timestamp、nonce 和 echostr 按字典序排序
	const sortedParams = [token, timestamp, nonce, echostr].sort().join('');
  
	// 使用 SHA1 计算签名
	const encoder = new TextEncoder();
	const data = encoder.encode(sortedParams);
	const hashBuffer = await crypto.subtle.digest('SHA-1', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  console.log(hashHex, msgSignature)
	// 比较计算出的签名与传入的签名
	return hashHex === msgSignature;
}
  
async function decryptEchostr(encodingAESKey, echostr) {
	// 将 EncodingAESKey 进行 Base64 解码
	const aesKeyBase64 = encodingAESKey + '=';
	const aesKeyBuffer = Uint8Array.from(atob(aesKeyBase64), c => c.charCodeAt(0));
  
	// 初始化 AES 解密器
	const key = await crypto.subtle.importKey(
	  'raw',
	  aesKeyBuffer,
	  { name: 'AES-CBC' },
	  false,
	  ['decrypt']
	);
  
	// 解密 echostr
	const iv = aesKeyBuffer.slice(0, 16); // 使用前 16 字节作为 IV
	const encryptedBuffer = Uint8Array.from(atob(echostr), c => c.charCodeAt(0));
	const decryptedBuffer = await crypto.subtle.decrypt(
	  { name: 'AES-CBC', iv },
	  key,
	  encryptedBuffer
	);
  
	// 将解密后的数据转换为字符串
	const decryptedText = new TextDecoder().decode(decryptedBuffer);
  
	// 去除填充字符
	const pad = decryptedText.charCodeAt(decryptedText.length - 1);
	if (pad < 1 || pad > 32) {
	  return null;
	}
	return decryptedText.slice(0, -pad);
}

export default {
  async fetch(request, env, ctx) {
	const url = new URL(request.url);  
	if (request.method !== 'GET') {
	  return new Response('Method Not Allowed', { status: 405 });
	}
  
	const msgSignature = url.searchParams.get('msg_signature');
	const timestamp = url.searchParams.get('timestamp');
	const nonce = url.searchParams.get('nonce');
	const echostr = url.searchParams.get('echostr');
  
	if (!msgSignature || !timestamp || !nonce || !echostr) {
	  return new Response('Invalid Request', { status: 400 });
	}
  
	const isValid = await verifySignature(TOKEN, timestamp, nonce, echostr, msgSignature);
	if (!isValid) {
	  return new Response('Invalid Signature', { status: 403 });
	}
  
	const decryptedEchostr = await decryptEchostr(ENCODING_AES_KEY, echostr);
	if (!decryptedEchostr) {
	  return new Response('Decryption Failed', { status: 500 });
	}
  
	return new Response(decryptedEchostr, { status: 200 });
  },
} ;
