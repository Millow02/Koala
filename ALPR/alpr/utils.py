MODULE_WIDTH = 15
verbose = 1
debug = 1
def add_bp(module, location):
    """
    Logs a debug breakpoint message if debugging is enabled.
    
    Args:
        module (str): The name or context of the module.
        location (str): Description of the breakpoint location.
        debug (bool): Whether to output the debug message.
    """
    if debug:
        print(f"{module:<{MODULE_WIDTH}} | Debug point at: {location}")

def log(module, message):
    """
    Logs a message with consistent formatting.
    
    Args:
        module (str): The name or context of the module.
        message (str): The message to log.
    """
    if verbose: 
        print(f"{module:<{MODULE_WIDTH}} | {message}")
    
def starter_log():
    koala_lines = [
         " ....  .:::::;;:...    ..:+;::;;;;;;;+++++++++++++++xxxxxXxx+xx+xxxxxxx$$$++++xxXXX&$$X$&$$&&",
         " :.:...  ..:;::;;;;::...   ..:::::::;;;;;;;;::::..::;;++++xxxxxxxxxXXXxxX+;;+++xxxX&$XXXX$&&&",
         " ;:::::.   .:;;::;;;;::...     ..:::::;;;: .:::::..  ..:;;+++xx+++++xxxx;;;+++++xX$$xxxxXX$&&",
         " +;:::::.   .......:;;;;::...       ... .:++++xxxXXX+::.::;;;;++++;;;+;;;;;;+xX&&$$XX++xxX$&&",
         " ++;:.....;xxxxXXXX+:...........::....::;x$x::;x$&&&XX+::.::;;:;;;;;;;;;;+xxX$$&&&$XXx+xx$$$$",
         " ++;:. .:;+xx+++x$&$x;;:..::....:.::;;++xX$$X++X&&&&$XX+;:.....:;;;;+++++;++xX$$&&&$XXx+X$$$&",
         " ++;.  .+xXXx+;;x&&&x;::......:::..::;;xX$$&&&&&&&&$$$X+;;:........:;;;++++x++X$$&&&$XXxXXXX$",
         " ;+;.. .;xX$$$$$&&&X+:..::::;;;;;;;+;;;+xX&&$$XxX$XXXX+;::::::........:;;;XX+;xX$$$&$Xx++X$$$",
         " +;:...:;xXXXx+;+X$+:.::;;;;;:;;+xXXXXxXXXXXX;:::;xXXX+;::+..:::::::....:x$x++;+X$$$&$XXXXX$$",
         " ++;:....;x+;:...;;:.::::::;$&&X;x$$+xX$$$Xx+;::;+xx+;::.;x:..:.:::::::;X$$x+++;+X$$$$$XXXxx+",
         " :;+;::...:;:.....::..$$;.+;.:+X&$$&&&&&XXXXx+xXXxxxx;...;Xx:.....::::+X$XXx;+++;+xX$$$$x+;;+",
         " :+++;;:. .:::;;:..:. +X;.:++X$&&&&&XxXxXxXXX$X;;+xx+:. .xXXx.  ....:+XXXxXX;;++;;xX$$$$x+;;;",
         " .;++++:.  .;++:. ..:;+x+. $&&&&&&$$$$$$$$X$$$x     .   :XXXxx.   ..+xX$xxXx::;++;+xXXXX$x++x",
         " .:;xx++;:.......  .::+;.  &&&&&$&xxxxX$$$$$$X;         ;xXXxx+. ..+xxXXxxx+:.:;+++++X$$$$XXX",
         " .:++xx++;;;::...  ..:;;;&X:$&&&&&&&&$$&&&&&$x.         :xXXxxx+. ;xxXXxxxx+::::;;+X$$$$$$$$$",
         " ..::;+++;;;:.... ..::+++X&: :+xXX&&&$&&&&$$$$x.;:      .+XXxxx;..;xxXx+x++:..:;xX$$$XX$$$$$X",
         " ::.. .;++;;::.  :;:.:;+xxX$x;+xX$&&&&&$$$$$$$$X:+x:     xxXXx++::+xXX++++;::+xXXXX$XxX$$$$$X",
         " +;;;:.;+;;:::. :;.  .:;++;+xxxxXXX$$$$$XXXXXX$$X;+xx+:  .xxxx+;;;+xXx++++:+XXXXX$$$+;+X$$$&$",
         " Xx+:.;;;;;:  .;++:.  ..:;+;+xxXXXXXXXxxxxxxxx$&&$++xxx+:..+xX+;:;xxX+;;;;xXXXXXXX$+:::xX$$$&",
         " Xx+:::;;: .:;+xxxx+:.....::::;++x++++++;;;+xX&&&&$x+++xx+::+xx;;;xx+;;:+xxxxXxXXX;;;;+xX$$$&",
         " XX++;;. ..:;+xX$$$$X+:....++x+;;;;:::::;;;xX&&&&&&$X++++++;:;x+++xx;;;xxxxxxxx+:::;;;+xX$$$&",
         " Xx+;;:  ..:;;+x$&&&$$X;.:+&&x::::::..::;x$$&&&&&&&&$$Xx++;++:;+;+++++xx++++x+::::::;+;;xXXX$",
         " Xx+;:  .:;+;::+++$&X::+X&$;..::;:..:;;+X$$&&&&$XxxxxXXXXxx+++x++++++++;;;;++XXXX$$$$$$$XXX$$",
         " Xx+;: .:;xxxx;;X$;:;$&&X+;;:;;;;;;;;;++xXXX$$&&&&Xx++++xxxxxxxxxxx++++xxxxxxXXX$$$$$$X+.;x$$",
         " Xx+;: .;+xxXX+;:x$&&Xx+;;;;:;;;+++++++;;+++xXX$&&&&&$xxxxxxx$&X+;;;xxxx+xxxxxxXXXXxxxxxx;+X$",
         " Xxx+;;.:+xxXXXx+++XXx;;;+;;:::;;;+X$$Xx++;+xxX$&&&&&&&&$xxX&&xxXXXXx+xxx++;;;;;+++xxxxxx++x$",
         " Xxx+;;::;X$XX$$&&&&&+::.        . ...x&&$:xxxX$$$x+xxXX$$$$&X$&$XX$x+xxxxxxxx+++++xxxxXXxxXX",
         " xxx+;;;:+$X;x$&&&&$x:.  .. ... .......;x+xXXX$$&$+..  ..:;;;+XXX$$X+;x+++xxxXX$XxxxxXXXXXxxx",
         " Xxx+;;;::...+X$$$Xx:. ..::..::....:;;;:;+xX$$$&&$x:...    .::++:;;;;;;+;;;;+++xxxxxxxXXXxx$$",
         " xxx+;......:;xX$X;:. ::.::.:;::;+++;;;+xX$&&$Xx+;;;;;:..   .:X;::::;;;;;++++++xx++xxxx+;$&&X",
         " xx+:.::+++;++xXx;;:..:;;;+;;++x+;++;;+X$$$&&$X++++x+++;:.. .x::;;:::;++;+++xxxxxxxxx+;x$&&$X",
         " x+:.;;+x+++++xXx;::.;;::;xxxxx+x;+xX$&&&$$&&&X++++x+;+x+:..::..:;;;:;;+++++xxxxxxx;;+X$$$$$$",
         " x:.;+++++;:+XXX$;;::;+xx+xx+++;;+X$$$$$$$$&&&$X;:;;;;+;+xXx:::.....:;;;;;;+++++xx+;:;+xxxX$$",
         " +.;++;+;++;::+X$X+;;+xxxxxXxx;xX$$$$$$X$&&&&X+:;;;;+;+xXx:::.....:;;;;;;++;::;;;++xXXXX$$XxX",
         " ::;++++;;;:::;+X$Xx;xXXXX+x;;x$$$$XXX$$$&&&$x;::;:;+;+xxx::+$$:.::::::::;;;;;+xXXXx+xxxxXXXX",
         " x;:.:::::::;+xxX$&$+xX$Xx;:x$XxxXX$$$$&&&&$XX+;::::::..:;X&&X+;;+;;;;;;;;+xX$$Xx+++xxxX$$$$X",
         " &&&X;:::::+xX$$$$&&&xXXx;+XX$$$$XXX$&&&&&&&$$Xx;::..:+$&&&&&&xXx+;;;++XXxx+++xXX$$$&&$$XXXX&",
         " &&&&&x:.:;X&&&&&&&&&&&Xxx$&$$$$$&&&&&&&&&&&&&&$+:.:+$&&&&&&&&&$Xxx++xxxxXXX$$&&&&&&$xxxxxX$&",
         " $&&&&&&x+$&&&&&$$$&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&+;$&&&&&&&&&$$XXXX$XX$&&&&&&&&&&&&&+++xxx$&&",
         " $&&&&$$$$XXX$$X$$&&&&&&$$XXx++;;;::+xx+;;;++++;::::;+xXXxxXXXXXXXX$Xx+++++xXXxxX$&&&&&&&$XXX",
         " &&&&&&$$$XXXXXXXXXXXxxxxXXXXxxx+;;;+XX+;++++;;;;;;;++xXXXXXXXX$XXx+xxXXXXxxX$XX$XXX$&&&&&$XX",
         " &&&&&$$$$$$$$$$$$$$XXXXXXXXXXXXxx++xXXx++++;;;++xxxxxX$$$$$XX$$$$$&$Xxxxxx$$XxX$&$$$$$&&$XXX",
         " &&&&&&&&&&&&&$$$$$$$XXXX$$$$XXXXxxxXXXx++++;+xx+++xxxXX$$$$$$$$&&&$xxxxx$&&$Xxx$&&&&&&$&$X$&"
    ]

    # Header/Title text (right side)
   # Header/Title text (right side) with ANSI colors
    header_lines = [
        "\033[1;33m     __   __   ___  __     \033[0m",
        "\033[1;33m     | | / /  \\ \\ / /           \033[0m",
        "\033[1;33m     | |/ /    \\ V /           \033[0m",
        "\033[1;33m     |   <      > <            \033[0m",
        "\033[1;33m     |_|\\_\\    /_/\\_|          \033[0m",
        "",
        "\033[1;32m         KOALA  v1.0\033[0m",
        "",
        "\033[1;34m  ALPR Core Software - Demo\033[0m"
    ]

    # Determine maximum number of lines for proper alignment
    max_lines = max(len(koala_lines), len(header_lines))
    spacing = "   "  # space between the koala art and header text

    # Print the combined ASCII art with header on the right side
    for i in range(max_lines):
        left_part = koala_lines[i] if i < len(koala_lines) else ""
        right_part = header_lines[i] if i < len(header_lines) else ""
        print(f"{left_part:<100}{spacing}{right_part}")

class test_manager():
    """
       Test manager contains many test specific functions. 

       Generate a single instance and pass it to each of the classes in the alpr folder. 
    """

    def store_generate_contours_R(self, img, test_folder="./test/rectified"):
        """
            Rectification contours stored in a specified folder.

            Img is in the cv2.imread format. 
        """
    
        log("RECTIFICATION", f"Storing the contoured images in the folder.")

        
