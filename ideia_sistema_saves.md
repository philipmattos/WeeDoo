# Ideia de Sistema "Passwordless Savecode"

Uma ideia brilhante registrada para a futura **Fase 2** de implementação do WeeDoo, substituindo a autenticação complexa (como Supabase/Firebase) por um sistema inspirado nos clássicos Video Games.

## A Dinâmica do "Savecode" Mestre
O Airtable funciona de forma fantástica rodando liso para as Listas de Compra através de Strings de ID longas. Podemos expandir esse conceito e aplicar na infraestrutura inteira do WeeDoo!

1. Na **Tela Inicial**, existirão as opções:
   - **Novo Usuário ("Criar Jogo"):** Ao clicar, o sistema gera uma `ID Mestre` única em nuvem.
   - O aplicativo apresentará a mensagem: *"Atenção! Guarde esse código à sete chaves!"*
   - O usuário toca no código e copia para a área de transferência do aparelho para guardá-la no WhatsApp, Email ou Bloco de Notas (estilo Senha de Recuperação).

2. **Login via Código ("Continuar Jogo"):**
   - Se o usuário resetar o sistema, formatar o aparelho ou quiser usar no computador: a tela inicial abrirá limpa e ele não tenta logar com e-mail/senha.
   - Ele apenas insere/cola seu código alfanumérico mestre no campo de resgate.
   - O sistema desce o "save" inteiro do Airtable ou semelhante, jogando novamente todas suas notas, projetos, kanbans e compromissos diretamente pro Cachê do dispositivo atual em segundos!

### Vantagens dessa Regra de Negócio:
* Fricção quase nula. Ninguém gosta de criar contas.
* A retenção de usuário sobe, todo mundo já entende a mecânica de enviar algo pro próprio WhatsApp para arquivar.
* Simplificação absoluta da engenharia de Backend, lidando apenas com sync direcional puxando ou empurrando objetos JSON mapeados para aquele "Token".
