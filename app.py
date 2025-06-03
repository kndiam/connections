from flask import Flask, render_template, request, jsonify
import json
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
    print(type(group_info))
    if sorted_key in group_info.keys():
        return jsonify({
            'correct': True,
            'category': group_info[sorted_key]['category'],
            'color': group_info[sorted_key]['color'],
            'difficulty': group_info[sorted_key]['difficulty']
        })
    
    return jsonify({'correct': False})

if __name__ == '__main__':
    app.run(debug=True)