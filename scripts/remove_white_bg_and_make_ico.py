from PIL import Image
import os

def remove_white_bg(input_path, output_path, threshold=250):
    im = Image.open(input_path).convert('RGBA')
    datas = im.getdata()
    newData = []
    for item in datas:
        # If pixel is nearly white and fully opaque, make it transparent
        if item[0] > threshold and item[1] > threshold and item[2] > threshold and item[3] > 200:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    im.putdata(newData)
    im.save(output_path)
    print(f"Saved transparent PNG: {output_path}")

def make_ico(input_path, output_path, sizes=[16, 32, 48]):
    im = Image.open(input_path)
    im.save(output_path, format='ICO', sizes=[(s, s) for s in sizes])
    print(f"Saved ICO: {output_path}")

if __name__ == '__main__':
    png_in = os.path.join('public', 'favicon.png')
    png_out = os.path.join('public', 'favicon-transparent.png')
    ico_out = os.path.join('public', 'favicon.ico')
    remove_white_bg(png_in, png_out)
    make_ico(png_out, ico_out) 