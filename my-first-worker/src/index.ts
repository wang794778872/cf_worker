interface Env {
	wx_db: KVNamespace;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		console.log(request.method)
		if (request.method == "GET")
		{
			const {pathname, searchParams} = new URL(request.url)
			console.log(pathname)
			if (pathname == "/kv")
			{
				const k = searchParams.get("k")
				if (!k)
					return new Response("error");
				const v = await env.wx_db.get(k);
				console.log(k, v)
				if (v)
					return new Response(v);
				else
					return new Response("error");
			}
			else if (pathname == "/set_kv")
			{
				const k = searchParams.get("k")
				const v = searchParams.get("v")
				console.log(k, v)
				if (!k || !v)
					return new Response("error");
				await env.wx_db.put(k, v);
				return new Response("ok");
			}
		}
		return new Response("failed");
	},
} satisfies ExportedHandler<Env>;
