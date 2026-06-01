import json

def edit_notebook(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        nb = json.load(f)
    
    # 1. Remove the "Unknown" class hack cells
    # We find the index of the cell containing "Fixing High Confidence for Random Inputs"
    start_idx = -1
    for i, cell in enumerate(nb['cells']):
        src = ''.join(cell.get('source', []))
        if "Fixing High Confidence for Random Inputs" in src:
            start_idx = i
            break
    
    if start_idx != -1:
        # Delete the markdown cell, the code cell, and the next markdown cell (3 cells total)
        print(f"Deleting 3 cells starting at index {start_idx} (Unknown class hack)")
        del nb['cells'][start_idx:start_idx+3]
    
    # 2. Fix the training cell to use `le` instead of `le_new`
    # Also, change the best model selection to Random Forest
    for cell in nb['cells']:
        if cell['cell_type'] == 'code':
            source = cell.get('source', [])
            
            # Fix le_new -> le
            for j, line in enumerate(source):
                if 'le_new.classes_' in line:
                    source[j] = line.replace('le_new.classes_', 'le.classes_')
                    print("Replaced le_new with le in AUC binarization")
                    
                # Fix NEW label encoder comment
                if 'using the NEW label encoder' in line:
                    source[j] = line.replace('using the NEW label encoder', 'using the label encoder')
                    
                # 3. Force selection of Random Forest instead of Naive Bayes
                if 'best_model_name = results_df.index[0]' in line:
                    source[j] = 'best_model_name = "Random Forest"\n'
                    print("Changed best_model_name to strictly select Random Forest")

            cell['source'] = source

    # Save the modified notebook
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=2)
    print("Notebook successfully updated.")

if __name__ == "__main__":
    edit_notebook('Disease_Diagnosis_ML_Trainin.ipynb')
