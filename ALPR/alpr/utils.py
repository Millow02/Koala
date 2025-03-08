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
