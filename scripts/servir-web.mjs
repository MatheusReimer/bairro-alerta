// Servidor estático do build web (dist-e2e) para os testes ponta a ponta. Rotas desconhecidas
// recebem o index.html, porque o Expo Router resolve a rota no navegador.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const raiz = join(process.cwd(), 'dist-e2e');
const porta = Number(process.env.PORTA_WEB ?? 8099);
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
};

createServer((req, res) => {
  const caminho = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  let arquivo = join(raiz, caminho);
  if (!arquivo.startsWith(raiz) || !existsSync(arquivo) || statSync(arquivo).isDirectory()) {
    arquivo = join(raiz, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': tipos[extname(arquivo)] ?? 'application/octet-stream' });
  createReadStream(arquivo).pipe(res);
}).listen(porta, '127.0.0.1', () => console.log(`Build web em http://127.0.0.1:${porta}`));
