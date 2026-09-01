# Pesquisa Acadêmica UNINASSAU

Protótipo React/Vite de formulário acadêmico com cascatas nativas:

- cidade -> bairro;
- cidade da escola -> categoria pública/privada -> escola;
- pesquisa de escola por nome;
- campos manuais quando uma opção não estiver cadastrada;
- validação por etapa e revisão antes do envio.

## Executar localmente

Requer Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Gerar versão de produção

```bash
npm run build
```

A pasta final será `dist`.

## Importante

Este pacote é um protótipo de interface. Os dados atuais de cursos, bairros e escolas são demonstrativos. Para produção, ainda será necessário:

1. importar a base completa de cursos, bairros e escolas;
2. conectar um banco de dados;
3. salvar respostas no backend;
4. criar painel administrativo e exportação;
5. incluir autenticação administrativa, política de privacidade e adequação à LGPD;
6. configurar domínio e deploy.
