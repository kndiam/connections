from flask import Flask, render_template, request, jsonify
import json
import os
import random

app = Flask(__name__)

with open('data/puzzles.json') as f:
    puzzles_data = json.load(f)

@app.route('/')
def index():
    selected_groups = []
    all_words = []
    group_info = {}
    
    for difficulty in ['difficulty1', 'difficulty2', 'difficulty3', 'difficulty4']:
        groups = puzzles_data[difficulty]['groups']
        selected_group = random.choice(groups)
        selected_groups.append(selected_group)
        all_words.extend(selected_group['words'])
        group_info[' '.join(sorted(selected_group['words']))] = {
            'category': selected_group['category'],
            'color': puzzles_data[difficulty]['color'],
            'difficulty': difficulty
        }
    
    random.shuffle(all_words)
    
    return render_template('index.html', 
                         words=all_words,
                         group_info=group_info)

@app.route('/check_answers', methods=['POST'])
def check_answers():
    user_words = request.json.get('words', [])
    
    group_info = request.json.get('group_info', {})
    sorted_key = ' '.join(sorted(user_words))
    print("HELLO")
    print(group_info)
    if sorted_key in group_info.keys():
        return jsonify({
            'correct': True,
            'category': group_info[sorted_key]['category'],
            'color': group_info[sorted_key]['color'],
            'difficulty': group_info[sorted_key]['difficulty']
        })

   
    for k in group_info.keys():
        if  set(k.split(' '))&set(user_words) ==3:
            return jsonify({'correct':False, 'type':'oneaway'})
    
    return jsonify({'correct': False, 'type':'completelywrong'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)