import json
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler

# Загружаем конфигурацию
with open('config.json', 'r') as config_file:
    config = json.load(config_file)

bot_token = config['bot_token']

# Функция для отправки ссылки на Web App
async def play(update: Update, context):
    # Указываем URL вашей игры на GitHub Pages
    web_app_url = "https://alimon05000.github.io/gametg/"  # Здесь ваш URL на GitHub Pages

    # Кнопка для Web App
    web_app_button = InlineKeyboardButton(text="Играть в Age of Phisphak", web_app=WebAppInfo(url=web_app_url))
    keyboard = [[web_app_button]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text("Нажмите кнопку, чтобы начать игру!", reply_markup=reply_markup)

# Основной код для запуска бота
def main():
    application = Application.builder().token(bot_token).build()

    # Команда для запуска игры через Web App
    application.add_handler(CommandHandler('play', play))

    # Запуск бота с использованием метода run_polling
    application.run_polling()

if __name__ == '__main__':
    main()
